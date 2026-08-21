CREATE OR REPLACE FUNCTION get_asset_value_history(
  input_user_id TEXT,
  input_asset_id TEXT,
  input_target_currency TEXT
)
RETURNS TABLE (
  "assetTimestamp" TIMESTAMP,
  "quantity" NUMERIC,
  "quantityId" TEXT,
  "stockPrice" NUMERIC,
  "stockPriceId" TEXT,
  "fxRate" NUMERIC,
  "fxRateId" TEXT,
  "quantityIsCarried" BOOLEAN,
  "stockPriceIsCarried" BOOLEAN,
  "fxRateIsCarried" BOOLEAN,
  "valueInTarget" NUMERIC
) AS $$
DECLARE
  asset_currency TEXT;
  asset_ticker TEXT;
BEGIN
  SELECT a."currency", a."tickerId"
  INTO asset_currency, asset_ticker
  FROM "NetWorthAsset" a
  WHERE a."id" = input_asset_id
    AND a."createdById" = input_user_id;

  RETURN QUERY
  WITH first_quantity_month AS (
    SELECT DATE_TRUNC('month', MIN("timestamp")) AS month
    FROM "NetWorthAssetQuantity"
    WHERE "netWorthAssetId" = input_asset_id
  ),
  raw_months AS (
    SELECT DATE_TRUNC('month', "timestamp") AS month
    FROM "NetWorthAssetQuantity"
    WHERE "netWorthAssetId" = input_asset_id
    UNION
    SELECT DATE_TRUNC('month', "timestamp") AS month
    FROM "StockPriceHistory"
    WHERE "tickerId" = asset_ticker
    UNION
    SELECT DATE_TRUNC('month', "timestamp") AS month
    FROM "ExchangeRate"
    WHERE "baseCurrency" = asset_currency
      AND "quoteCurrency" = input_target_currency
  ),
  all_months AS (
    SELECT raw_months.month
    FROM raw_months, first_quantity_month
    WHERE raw_months.month >= first_quantity_month.month
  ),
  monthly_values AS (
    SELECT
      m.month,
      q.id AS quantity_id,
      q.quantity,
      q.timestamp AS quantity_timestamp,
      s.id AS stock_price_id,
      s.price AS stock_price,
      s.timestamp AS stock_price_timestamp,
      f.id AS fx_rate_id,
      f.rate AS fx_rate,
      f.timestamp AS fx_rate_timestamp
    FROM all_months m
    LEFT JOIN LATERAL (
      SELECT q."id", q."quantity", q."timestamp"
      FROM "NetWorthAssetQuantity" q
      WHERE q."netWorthAssetId" = input_asset_id
        AND q."timestamp" < m.month + INTERVAL '1 month'
      ORDER BY q."timestamp" DESC
      LIMIT 1
    ) q ON TRUE
    LEFT JOIN LATERAL (
      SELECT s."id", s."price", s."timestamp"
      FROM "StockPriceHistory" s
      WHERE s."tickerId" = asset_ticker
        AND s."timestamp" < m.month + INTERVAL '1 month'
      ORDER BY s."timestamp" DESC
      LIMIT 1
    ) s ON TRUE
    LEFT JOIN LATERAL (
      SELECT f."id", f."rate", f."timestamp"
      FROM "ExchangeRate" f
      WHERE f."baseCurrency" = asset_currency
        AND f."quoteCurrency" = input_target_currency
        AND f."timestamp" < m.month + INTERVAL '1 month'
      ORDER BY f."timestamp" DESC
      LIMIT 1
    ) f ON TRUE
  )
  SELECT
    mv.month AS "assetTimestamp",
    mv.quantity,
    mv.quantity_id AS "quantityId",
    mv.stock_price AS "stockPrice",
    mv.stock_price_id AS "stockPriceId",
    mv.fx_rate AS "fxRate",
    mv.fx_rate_id AS "fxRateId",
    DATE_TRUNC('month', mv.quantity_timestamp) <> mv.month AS "quantityIsCarried",
    DATE_TRUNC('month', mv.stock_price_timestamp) <> mv.month AS "stockPriceIsCarried",
    DATE_TRUNC('month', mv.fx_rate_timestamp) <> mv.month AS "fxRateIsCarried",
    COALESCE(mv.quantity, 0) * COALESCE(mv.stock_price, 1) * COALESCE(mv.fx_rate, 1) AS "valueInTarget"
  FROM monthly_values mv
  ORDER BY mv.month DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_debt_value_history(
  input_user_id TEXT,
  input_debt_id TEXT,
  input_target_currency TEXT
)
RETURNS TABLE (
  "debtTimestamp" TIMESTAMP,
  "quantity" NUMERIC,
  "quantityId" TEXT,
  "fxRate" NUMERIC,
  "fxRateId" TEXT,
  "quantityIsCarried" BOOLEAN,
  "fxRateIsCarried" BOOLEAN,
  "valueInTarget" NUMERIC
) AS $$
DECLARE
  debt_currency TEXT;
BEGIN
  SELECT d."currency"
  INTO debt_currency
  FROM "NetWorthDebt" d
  WHERE d."id" = input_debt_id
    AND d."createdById" = input_user_id;

  RETURN QUERY
  WITH first_quantity_month AS (
    SELECT DATE_TRUNC('month', MIN("timestamp")) AS month
    FROM "NetWorthDebtQuantity"
    WHERE "netWorthDebtId" = input_debt_id
  ),
  raw_months AS (
    SELECT DATE_TRUNC('month', "timestamp") AS month
    FROM "NetWorthDebtQuantity"
    WHERE "netWorthDebtId" = input_debt_id
    UNION
    SELECT DATE_TRUNC('month', "timestamp") AS month
    FROM "ExchangeRate"
    WHERE "baseCurrency" = debt_currency
      AND "quoteCurrency" = input_target_currency
  ),
  all_months AS (
    SELECT raw_months.month
    FROM raw_months, first_quantity_month
    WHERE raw_months.month >= first_quantity_month.month
  ),
  monthly_values AS (
    SELECT
      m.month,
      q.id AS quantity_id,
      q.quantity,
      q.timestamp AS quantity_timestamp,
      f.id AS fx_rate_id,
      f.rate AS fx_rate,
      f.timestamp AS fx_rate_timestamp
    FROM all_months m
    LEFT JOIN LATERAL (
      SELECT q."id", q."quantity", q."timestamp"
      FROM "NetWorthDebtQuantity" q
      WHERE q."netWorthDebtId" = input_debt_id
        AND q."timestamp" < m.month + INTERVAL '1 month'
      ORDER BY q."timestamp" DESC
      LIMIT 1
    ) q ON TRUE
    LEFT JOIN LATERAL (
      SELECT f."id", f."rate", f."timestamp"
      FROM "ExchangeRate" f
      WHERE f."baseCurrency" = debt_currency
        AND f."quoteCurrency" = input_target_currency
        AND f."timestamp" < m.month + INTERVAL '1 month'
      ORDER BY f."timestamp" DESC
      LIMIT 1
    ) f ON TRUE
  )
  SELECT
    mv.month AS "debtTimestamp",
    mv.quantity,
    mv.quantity_id AS "quantityId",
    mv.fx_rate AS "fxRate",
    mv.fx_rate_id AS "fxRateId",
    DATE_TRUNC('month', mv.quantity_timestamp) <> mv.month AS "quantityIsCarried",
    DATE_TRUNC('month', mv.fx_rate_timestamp) <> mv.month AS "fxRateIsCarried",
    COALESCE(mv.quantity, 0) * COALESCE(mv.fx_rate, 1) AS "valueInTarget"
  FROM monthly_values mv
  ORDER BY mv.month DESC;
END;
$$ LANGUAGE plpgsql;
