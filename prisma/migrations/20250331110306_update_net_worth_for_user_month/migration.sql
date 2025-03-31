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
    AND fx."timestamp" < (date_trunc('month', input_timestamp) + INTERVAL '1 month')
    ORDER BY fx."timestamp" DESC
    LIMIT 1
  ) fx ON d."currency" <> input_target_currency
  WHERE d."createdById" = input_user_id
    AND dq."timestamp" >= date_trunc('month', input_timestamp)
    AND dq."timestamp" < (date_trunc('month', input_timestamp) + INTERVAL '1 month');
END;
$$ LANGUAGE plpgsql;