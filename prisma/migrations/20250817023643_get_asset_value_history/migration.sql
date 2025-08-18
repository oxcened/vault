DROP FUNCTION get_asset_value_history;

CREATE FUNCTION get_asset_value_history(
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
  WITH first_quantity_ts AS (
    SELECT MIN("timestamp") AS min_ts
    FROM "NetWorthAssetQuantity"
    WHERE "netWorthAssetId" = input_asset_id
  ),
  raw_timestamps AS (
    SELECT DISTINCT "timestamp" FROM "NetWorthAssetQuantity" WHERE "netWorthAssetId" = input_asset_id
    UNION
    SELECT DISTINCT "timestamp" FROM "StockPriceHistory" WHERE "tickerId" = asset_ticker
    UNION
    SELECT DISTINCT "timestamp" FROM "ExchangeRate"
      WHERE "baseCurrency" = asset_currency
      AND "quoteCurrency" = input_target_currency
  ),
  all_timestamps AS (
    SELECT timestamp
    FROM raw_timestamps, first_quantity_ts
    WHERE timestamp >= first_quantity_ts.min_ts
  ),
  latest_quantity AS (
    SELECT ts.timestamp,
           (SELECT q."id" FROM "NetWorthAssetQuantity" q WHERE q."netWorthAssetId" = input_asset_id AND q."timestamp" <= ts.timestamp ORDER BY q."timestamp" DESC LIMIT 1) AS id,
           (SELECT q."quantity" FROM "NetWorthAssetQuantity" q WHERE q."netWorthAssetId" = input_asset_id AND q."timestamp" <= ts.timestamp ORDER BY q."timestamp" DESC LIMIT 1) AS quantity,
           (SELECT q."timestamp" FROM "NetWorthAssetQuantity" q WHERE q."netWorthAssetId" = input_asset_id AND q."timestamp" <= ts.timestamp ORDER BY q."timestamp" DESC LIMIT 1) AS ts_match
    FROM all_timestamps ts
  ),
  latest_stock AS (
    SELECT ts.timestamp,
           (SELECT s."id" FROM "StockPriceHistory" s WHERE s."tickerId" = asset_ticker AND s."timestamp" <= ts.timestamp ORDER BY s."timestamp" DESC LIMIT 1) AS id,
           (SELECT s."price" FROM "StockPriceHistory" s WHERE s."tickerId" = asset_ticker AND s."timestamp" <= ts.timestamp ORDER BY s."timestamp" DESC LIMIT 1) AS price,
           (SELECT s."timestamp" FROM "StockPriceHistory" s WHERE s."tickerId" = asset_ticker AND s."timestamp" <= ts.timestamp ORDER BY s."timestamp" DESC LIMIT 1) AS ts_match
    FROM all_timestamps ts
  ),
  latest_fx AS (
    SELECT ts.timestamp,
           (SELECT f."id" FROM "ExchangeRate" f WHERE f."baseCurrency" = asset_currency AND f."quoteCurrency" = input_target_currency AND f."timestamp" <= ts.timestamp ORDER BY f."timestamp" DESC LIMIT 1) AS id,
           (SELECT f."rate" FROM "ExchangeRate" f WHERE f."baseCurrency" = asset_currency AND f."quoteCurrency" = input_target_currency AND f."timestamp" <= ts.timestamp ORDER BY f."timestamp" DESC LIMIT 1) AS rate,
           (SELECT f."timestamp" FROM "ExchangeRate" f WHERE f."baseCurrency" = asset_currency AND f."quoteCurrency" = input_target_currency AND f."timestamp" <= ts.timestamp ORDER BY f."timestamp" DESC LIMIT 1) AS ts_match
    FROM all_timestamps ts
  )
  SELECT
    ts.timestamp AS "assetTimestamp",
    latest_quantity.quantity,
    latest_quantity.id AS "quantityId",
    latest_stock.price AS "stockPrice",
    latest_stock.id AS "stockPriceId",
    latest_fx.rate AS "fxRate",
    latest_fx.id AS "fxRateId",
    latest_quantity.ts_match <> ts.timestamp AS "quantityIsCarried",
    latest_stock.ts_match <> ts.timestamp AS "stockPriceIsCarried",
    latest_fx.ts_match <> ts.timestamp AS "fxRateIsCarried",
    COALESCE(latest_quantity.quantity,0) * COALESCE(latest_stock.price,1) * COALESCE(latest_fx.rate,1) AS "valueInTarget"
  FROM all_timestamps ts
  LEFT JOIN latest_quantity ON latest_quantity.timestamp = ts.timestamp
  LEFT JOIN latest_stock ON latest_stock.timestamp = ts.timestamp
  LEFT JOIN latest_fx ON latest_fx.timestamp = ts.timestamp
  ORDER BY "assetTimestamp" DESC;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION get_debt_value_history;

CREATE FUNCTION get_debt_value_history(
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
  WITH first_quantity_ts AS (
    SELECT MIN("timestamp") AS min_ts
    FROM "NetWorthDebtQuantity"
    WHERE "netWorthDebtId" = input_debt_id
  ),
  raw_timestamps AS (
    SELECT DISTINCT "timestamp"
    FROM "NetWorthDebtQuantity"
    WHERE "netWorthDebtId" = input_debt_id
    UNION
    SELECT DISTINCT "timestamp"
    FROM "ExchangeRate"
    WHERE "baseCurrency" = debt_currency
      AND "quoteCurrency" = input_target_currency
  ),
  all_timestamps AS (
    SELECT timestamp
    FROM raw_timestamps, first_quantity_ts
    WHERE timestamp >= first_quantity_ts.min_ts
  ),
  latest_quantity AS (
    SELECT ts.timestamp,
           (SELECT q."id"
            FROM "NetWorthDebtQuantity" q
            WHERE q."netWorthDebtId" = input_debt_id AND q."timestamp" <= ts.timestamp
            ORDER BY q."timestamp" DESC LIMIT 1) AS id,
           (SELECT q."quantity"
            FROM "NetWorthDebtQuantity" q
            WHERE q."netWorthDebtId" = input_debt_id AND q."timestamp" <= ts.timestamp
            ORDER BY q."timestamp" DESC LIMIT 1) AS quantity,
           (SELECT q."timestamp"
            FROM "NetWorthDebtQuantity" q
            WHERE q."netWorthDebtId" = input_debt_id AND q."timestamp" <= ts.timestamp
            ORDER BY q."timestamp" DESC LIMIT 1) AS ts_match
    FROM all_timestamps ts
  ),
  latest_fx AS (
    SELECT ts.timestamp,
           (SELECT f."id"
            FROM "ExchangeRate" f
            WHERE f."baseCurrency" = debt_currency AND f."quoteCurrency" = input_target_currency
              AND f."timestamp" <= ts.timestamp
            ORDER BY f."timestamp" DESC LIMIT 1) AS id,
           (SELECT f."rate"
            FROM "ExchangeRate" f
            WHERE f."baseCurrency" = debt_currency AND f."quoteCurrency" = input_target_currency
              AND f."timestamp" <= ts.timestamp
            ORDER BY f."timestamp" DESC LIMIT 1) AS rate,
           (SELECT f."timestamp"
            FROM "ExchangeRate" f
            WHERE f."baseCurrency" = debt_currency AND f."quoteCurrency" = input_target_currency
              AND f."timestamp" <= ts.timestamp
            ORDER BY f."timestamp" DESC LIMIT 1) AS ts_match
    FROM all_timestamps ts
  )
  SELECT
    ts.timestamp AS "debtTimestamp",
    latest_quantity.quantity,
    latest_quantity.id AS "quantityId",
    latest_fx.rate AS "fxRate",
    latest_fx.id AS "fxRateId",
    latest_quantity.ts_match <> ts.timestamp AS "quantityIsCarried",
    latest_fx.ts_match <> ts.timestamp AS "fxRateIsCarried",
    COALESCE(latest_quantity.quantity,0) * COALESCE(latest_fx.rate,1) AS "valueInTarget"
  FROM all_timestamps ts
  LEFT JOIN latest_quantity ON latest_quantity.timestamp = ts.timestamp
  LEFT JOIN latest_fx ON latest_fx.timestamp = ts.timestamp
  ORDER BY "debtTimestamp" DESC;
END;
$$ LANGUAGE plpgsql;