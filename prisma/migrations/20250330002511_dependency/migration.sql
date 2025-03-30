-- Drop deprecated function if it exists
DROP FUNCTION IF EXISTS update_net_worth_from_date(DATE, VARCHAR, VARCHAR);

-- CreateTable
CREATE TABLE "DerivedDataDependency" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetKey" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL,
    "dependencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DerivedDataDependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DerivedDataDependency_targetType_targetKey_idx" ON "DerivedDataDependency"("targetType", "targetKey");

-- CreateIndex
CREATE INDEX "DerivedDataDependency_dependencyType_dependencyKey_idx" ON "DerivedDataDependency"("dependencyType", "dependencyKey");

-- Create or replace function to update net worth for a single user and month
CREATE OR REPLACE FUNCTION update_net_worth_for_user_month(
  input_user_id TEXT,
  input_timestamp TIMESTAMP,
  input_target_currency TEXT
)
RETURNS VOID AS $$
DECLARE
  month_start TIMESTAMP := date_trunc('month', input_timestamp);
  month_end DATE := (date_trunc('month', input_timestamp) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  net_worth NUMERIC := 0;
  asset_value NUMERIC := 0;
  debt_value NUMERIC := 0;
  dependency_keys TEXT[];
  asset_values RECORD;
  debt_values RECORD;
BEGIN
  -- Delete previous dependencies for this user/month
  DELETE FROM "DerivedDataDependency"
  WHERE "targetType" = 'NetWorth' AND "targetKey" = input_user_id || ':' || to_char(input_timestamp, 'YYYY-MM-DD"T"HH24:MI:SS');

  -- Calculate total assets
  SELECT COALESCE(SUM("valueInTarget"), 0)
  INTO asset_value
  FROM get_asset_values_for_user_month(input_user_id, input_timestamp, input_target_currency);

  -- Calculate total debts
  SELECT COALESCE(SUM("valueInTarget"), 0)
  INTO debt_value
  FROM get_debt_values_for_user_month(input_user_id, input_timestamp, input_target_currency);

  -- Final net worth
  net_worth := asset_value - debt_value;

  -- Upsert into NetWorth table
  INSERT INTO "NetWorth" ("id", "createdById", "timestamp", "totalAssets", "totalDebts", "netValue", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), input_user_id, month_start, asset_value, debt_value, net_worth, now(), now())
  ON CONFLICT ("createdById", "timestamp") DO UPDATE
  SET "totalAssets" = EXCLUDED."totalAssets",
      "totalDebts" = EXCLUDED."totalDebts",
      "netValue" = EXCLUDED."netValue",
      "updatedAt" = EXCLUDED."updatedAt";

  -- Register stock price dependencies using stock price ID
  INSERT INTO "DerivedDataDependency" ("id", "targetType", "targetKey", "dependencyType", "dependencyKey", "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    'NetWorth',
    input_user_id || ':' || to_char(input_timestamp, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'StockPrice',
    av."stockPriceId",
    now(),
    now()
  FROM get_asset_values_for_user_month(input_user_id, input_timestamp, input_target_currency) av
  WHERE av."stockPriceId" IS NOT NULL
  GROUP BY av."stockPriceId";

  -- Register FX rate dependencies from assets using exchange rate ID
  INSERT INTO "DerivedDataDependency" ("id", "targetType", "targetKey", "dependencyType", "dependencyKey", "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    'NetWorth',
    input_user_id || ':' || to_char(input_timestamp, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'ExchangeRate',
    av."exchangeRateId",
    now(),
    now()
  FROM get_asset_values_for_user_month(input_user_id, input_timestamp, input_target_currency) av
  WHERE av."exchangeRateId" IS NOT NULL
  GROUP BY av."exchangeRateId";

  -- Register FX rate dependencies from debts using exchange rate ID
  INSERT INTO "DerivedDataDependency" ("id", "targetType", "targetKey", "dependencyType", "dependencyKey", "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    'NetWorth',
    input_user_id || ':' || to_char(input_timestamp, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'ExchangeRate',
    dv."exchangeRateId",
    now(),
    now()
  FROM get_debt_values_for_user_month(input_user_id, input_timestamp, input_target_currency) dv
  WHERE dv."exchangeRateId" IS NOT NULL
  GROUP BY dv."exchangeRateId";

END;
$$ LANGUAGE plpgsql;

-- Create or replace function to get asset values for a user and month
CREATE OR REPLACE FUNCTION get_asset_values_for_user_month(
  input_user_id TEXT,
  input_timestamp TIMESTAMP,
  input_target_currency TEXT
)
RETURNS TABLE (
  "quantityId" TEXT,
  "createdById" TEXT,
  "timestamp" TIMESTAMP,
  "quantity" NUMERIC,
  "assetCurrency" TEXT,
  "tickerId" TEXT,
  "stockPrice" NUMERIC,
  "stockPriceId" TEXT,
  "fxRate" NUMERIC,
  "exchangeRateId" TEXT,
  "valueInTarget" NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aq."id",
    a."createdById",
    aq."timestamp",
    aq."quantity",
    a."currency",
    a."tickerId",
    sp."price",
    sp."id",
    fx."rate",
    fx."id",
    COALESCE(aq."quantity", 0)
      * COALESCE(sp."price", 1)
      * COALESCE(fx."rate", 1)
  FROM "NetWorthAssetQuantity" aq
  JOIN "NetWorthAsset" a ON a."id" = aq."netWorthAssetId"
  LEFT JOIN LATERAL (
    SELECT sp."price", sp."id"
    FROM "StockPriceHistory" sp
    WHERE sp."tickerId" = a."tickerId"
      AND sp."timestamp" <= aq."timestamp"
    ORDER BY sp."timestamp" DESC
    LIMIT 1
  ) sp ON TRUE
  LEFT JOIN LATERAL (
    SELECT fx."rate", fx."quoteCurrency", fx."id"
    FROM "ExchangeRate" fx
    WHERE fx."baseCurrency" = a."currency"
      AND fx."quoteCurrency" = input_target_currency
      AND fx."timestamp" <= aq."timestamp"
    ORDER BY fx."timestamp" DESC
    LIMIT 1
  ) fx ON a."currency" <> input_target_currency
  WHERE a."createdById" = input_user_id
    AND aq."timestamp" >= date_trunc('month', input_timestamp)
    AND aq."timestamp" < (date_trunc('month', input_timestamp) + INTERVAL '1 month');
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to get debt values for a user and month
CREATE OR REPLACE FUNCTION get_debt_values_for_user_month(
  input_user_id TEXT,
  input_timestamp TIMESTAMP,
  input_target_currency TEXT
)
RETURNS TABLE (
  "quantityId" TEXT,
  "createdById" TEXT,
  "timestamp" TIMESTAMP,
  "quantity" NUMERIC,
  "debtCurrency" TEXT,
  "fxRate" NUMERIC,
  "exchangeRateId" TEXT,
  "valueInTarget" NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dq."id",
    d."createdById",
    dq."timestamp",
    dq."quantity",
    d."currency",
    fx."rate",
    fx."id",
    COALESCE(dq."quantity", 0) * COALESCE(fx."rate", 1)
  FROM "NetWorthDebtQuantity" dq
  JOIN "NetWorthDebt" d ON d."id" = dq."netWorthDebtId"
  LEFT JOIN LATERAL (
    SELECT fx."rate", fx."quoteCurrency", fx."id"
    FROM "ExchangeRate" fx
    WHERE fx."baseCurrency" = d."currency"
      AND fx."quoteCurrency" = input_target_currency
      AND fx."timestamp" <= dq."timestamp"
    ORDER BY fx."timestamp" DESC
    LIMIT 1
  ) fx ON d."currency" <> input_target_currency
  WHERE d."createdById" = input_user_id
    AND dq."timestamp" >= date_trunc('month', input_timestamp)
    AND dq."timestamp" < (date_trunc('month', input_timestamp) + INTERVAL '1 month');
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to recompute derived data for a dependency
CREATE OR REPLACE FUNCTION recompute_derived_data_for_dependency(
  input_dependency_type TEXT,
  input_dependency_key TEXT,
  input_target_currency TEXT
)
RETURNS VOID AS $$
DECLARE
  record_row RECORD;
  target_type TEXT;
  target_key TEXT;
  user_id TEXT;
  snapshot_ts TIMESTAMP;
BEGIN
  FOR record_row IN
    SELECT "targetType", "targetKey"
    FROM "DerivedDataDependency"
    WHERE "dependencyType" = input_dependency_type
      AND "dependencyKey" = input_dependency_key
  LOOP
    target_type := record_row."targetType";
    target_key := record_row."targetKey";

    -- Dispatch to the appropriate recompute logic
    IF target_type = 'NetWorth' THEN
      user_id := split_part(target_key, ':', 1);
      snapshot_ts := to_timestamp(split_part(target_key, ':', 2), 'YYYY-MM-DD"T"HH24:MI:SS');
      PERFORM update_net_worth_for_user_month(user_id, snapshot_ts, input_target_currency);
    ELSE
      -- Future targetType handlers can be added here
      RAISE NOTICE 'No recompute handler for target type %', target_type;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a helper function to recompute net worth for a user from a specific date
CREATE OR REPLACE FUNCTION recompute_net_worth_for_user_from(
  input_user_id TEXT,
  input_start_date DATE,
  input_target_currency TEXT
)
RETURNS VOID AS $$
DECLARE
  current_month DATE := date_trunc('month', input_start_date);
  today_month DATE := date_trunc('month', CURRENT_DATE);
BEGIN
  WHILE current_month <= today_month LOOP
    PERFORM update_net_worth_for_user_month(input_user_id, current_month, input_target_currency);
    current_month := current_month + INTERVAL '1 month';
  END LOOP;
END;
$$ LANGUAGE plpgsql;
