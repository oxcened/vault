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
  WHERE "targetType" = 'NetWorth' AND "targetKey" = input_user_id || ':' || to_char(month_end, 'YYYY-MM-DD"T"HH24:MI:SS');

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
  VALUES (gen_random_uuid(), input_user_id, month_end, asset_value, debt_value, net_worth, now(), now())
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
    input_user_id || ':' || to_char(month_end, 'YYYY-MM-DD"T"HH24:MI:SS'),
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
    input_user_id || ':' || to_char(month_end, 'YYYY-MM-DD"T"HH24:MI:SS'),
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
    input_user_id || ':' || to_char(month_end, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'ExchangeRate',
    dv."exchangeRateId",
    now(),
    now()
  FROM get_debt_values_for_user_month(input_user_id, input_timestamp, input_target_currency) dv
  WHERE dv."exchangeRateId" IS NOT NULL
  GROUP BY dv."exchangeRateId";

END;
$$ LANGUAGE plpgsql;