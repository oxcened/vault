-- Drop functions before replacing to allow return type changes
DROP FUNCTION IF EXISTS get_asset_values_for_user_month(TEXT, TIMESTAMP, TEXT);
DROP FUNCTION IF EXISTS get_debt_values_for_user_month(TEXT, TIMESTAMP, TEXT);

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
  "valueInTarget" NUMERIC,
  "assetId" TEXT,
  "assetName" TEXT,
  "stockTicker" TEXT,
  "categoryId" TEXT,
  "categoryName" TEXT
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
      * COALESCE(fx."rate", 1),
    a."id" AS "assetId",
    a."name" AS "assetName",
    st."ticker" AS "stockTicker",
    c."id" AS "categoryId",
    c."name" AS "categoryName"
  FROM "NetWorthAsset" a
  JOIN "NetWorthCategory" c ON a."categoryId" = c."id"
  LEFT JOIN "StockTicker" st ON a."tickerId" = st."id"
  LEFT JOIN LATERAL (
    SELECT aq.*
    FROM "NetWorthAssetQuantity" aq
    WHERE aq."netWorthAssetId" = a."id"
      AND aq."timestamp" < (date_trunc('month', input_timestamp) + INTERVAL '1 month')
    ORDER BY aq."timestamp" DESC
    LIMIT 1
  ) aq ON TRUE
  LEFT JOIN LATERAL (
    SELECT sp."price", sp."id"
    FROM "StockPriceHistory" sp
    WHERE sp."tickerId" = a."tickerId"
      AND sp."timestamp" < (date_trunc('month', input_timestamp) + INTERVAL '1 month')
    ORDER BY sp."timestamp" DESC
    LIMIT 1
  ) sp ON TRUE
  LEFT JOIN LATERAL (
    SELECT fx."rate", fx."quoteCurrency", fx."id"
    FROM "ExchangeRate" fx
    WHERE fx."baseCurrency" = a."currency"
      AND fx."quoteCurrency" = input_target_currency
      AND fx."timestamp" < (date_trunc('month', input_timestamp) + INTERVAL '1 month')
    ORDER BY fx."timestamp" DESC
    LIMIT 1
  ) fx ON a."currency" <> input_target_currency
  WHERE a."createdById" = input_user_id;
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
  "valueInTarget" NUMERIC,
  "debtId" TEXT,
  "debtName" TEXT,
  "categoryId" TEXT,
  "categoryName" TEXT
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
    COALESCE(dq."quantity", 0) * COALESCE(fx."rate", 1),
    d."id" AS "debtId",
    d."name" AS "debtName",
    c."id" AS "categoryId",
    c."name" AS "categoryName"
  FROM "NetWorthDebt" d
  JOIN "NetWorthCategory" c ON d."categoryId" = c."id"
  LEFT JOIN LATERAL (
    SELECT dq.*
    FROM "NetWorthDebtQuantity" dq
    WHERE dq."netWorthDebtId" = d."id"
      AND dq."timestamp" < (date_trunc('month', input_timestamp) + INTERVAL '1 month')
    ORDER BY dq."timestamp" DESC
    LIMIT 1
  ) dq ON TRUE
  LEFT JOIN LATERAL (
    SELECT fx."rate", fx."quoteCurrency", fx."id"
    FROM "ExchangeRate" fx
    WHERE fx."baseCurrency" = d."currency"
      AND fx."quoteCurrency" = input_target_currency
    AND fx."timestamp" < (date_trunc('month', input_timestamp) + INTERVAL '1 month')
    ORDER BY fx."timestamp" DESC
    LIMIT 1
  ) fx ON d."currency" <> input_target_currency
  WHERE d."createdById" = input_user_id;
END;
$$ LANGUAGE plpgsql;