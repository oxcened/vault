CREATE OR REPLACE FUNCTION get_asset_value_history(
  input_user_id TEXT,
  input_asset_id TEXT,
  input_target_currency TEXT
)
RETURNS TABLE (
  "assetTimestamp" TIMESTAMP,
  "quantity" NUMERIC,
  "stockPrice" NUMERIC,
  "fxRate" NUMERIC,
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
  )
  SELECT
    timestamp_source."timestamp" AS "assetTimestamp",

    (SELECT nw_quantity."quantity" FROM "NetWorthAssetQuantity" nw_quantity
     WHERE nw_quantity."netWorthAssetId" = input_asset_id
       AND nw_quantity."timestamp" <= timestamp_source."timestamp"
     ORDER BY nw_quantity."timestamp" DESC LIMIT 1) AS quantity,

    (SELECT stock_price."price" FROM "StockPriceHistory" stock_price
     WHERE stock_price."tickerId" = asset_ticker
       AND stock_price."timestamp" <= timestamp_source."timestamp"
     ORDER BY stock_price."timestamp" DESC LIMIT 1) AS stockPrice,

    (SELECT fx_rate."rate" FROM "ExchangeRate" fx_rate
     WHERE fx_rate."baseCurrency" = asset_currency
       AND fx_rate."quoteCurrency" = input_target_currency
       AND fx_rate."timestamp" <= timestamp_source."timestamp"
     ORDER BY fx_rate."timestamp" DESC LIMIT 1) AS fxRate,

    (
      COALESCE((SELECT nw_quantity."quantity" FROM "NetWorthAssetQuantity" nw_quantity
                WHERE nw_quantity."netWorthAssetId" = input_asset_id
                  AND nw_quantity."timestamp" <= timestamp_source."timestamp"
                ORDER BY nw_quantity."timestamp" DESC LIMIT 1), 0)
      * COALESCE((SELECT stock_price."price" FROM "StockPriceHistory" stock_price
                  WHERE stock_price."tickerId" = asset_ticker
                    AND stock_price."timestamp" <= timestamp_source."timestamp"
                  ORDER BY stock_price."timestamp" DESC LIMIT 1), 1)
      * COALESCE((SELECT fx_rate."rate" FROM "ExchangeRate" fx_rate
                  WHERE fx_rate."baseCurrency" = asset_currency
                    AND fx_rate."quoteCurrency" = input_target_currency
                    AND fx_rate."timestamp" <= timestamp_source."timestamp"
                  ORDER BY fx_rate."timestamp" DESC LIMIT 1), 1)
    ) AS valueInTarget

  FROM all_timestamps timestamp_source
  ORDER BY "assetTimestamp" DESC;
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
  "fxRate" NUMERIC,
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
    SELECT DISTINCT "timestamp" FROM "NetWorthDebtQuantity" WHERE "netWorthDebtId" = input_debt_id
    UNION
    SELECT DISTINCT "timestamp" FROM "ExchangeRate"
      WHERE "baseCurrency" = debt_currency
      AND "quoteCurrency" = input_target_currency
  ),
  all_timestamps AS (
    SELECT timestamp
    FROM raw_timestamps, first_quantity_ts
    WHERE timestamp >= first_quantity_ts.min_ts
  )
  SELECT
    timestamp_source."timestamp" AS "debtTimestamp",

    (SELECT nd_quantity."quantity" FROM "NetWorthDebtQuantity" nd_quantity
     WHERE nd_quantity."netWorthDebtId" = input_debt_id
       AND nd_quantity."timestamp" <= timestamp_source."timestamp"
     ORDER BY nd_quantity."timestamp" DESC LIMIT 1) AS quantity,

    (SELECT fx_rate."rate" FROM "ExchangeRate" fx_rate
     WHERE fx_rate."baseCurrency" = debt_currency
       AND fx_rate."quoteCurrency" = input_target_currency
       AND fx_rate."timestamp" <= timestamp_source."timestamp"
     ORDER BY fx_rate."timestamp" DESC LIMIT 1) AS fxRate,

    (
      COALESCE((SELECT nd_quantity."quantity" FROM "NetWorthDebtQuantity" nd_quantity
                WHERE nd_quantity."netWorthDebtId" = input_debt_id
                  AND nd_quantity."timestamp" <= timestamp_source."timestamp"
                ORDER BY nd_quantity."timestamp" DESC LIMIT 1), 0)
      * COALESCE((SELECT fx_rate."rate" FROM "ExchangeRate" fx_rate
                  WHERE fx_rate."baseCurrency" = debt_currency
                    AND fx_rate."quoteCurrency" = input_target_currency
                    AND fx_rate."timestamp" <= timestamp_source."timestamp"
                  ORDER BY fx_rate."timestamp" DESC LIMIT 1), 1)
    ) AS valueInTarget

  FROM all_timestamps timestamp_source
  ORDER BY "debtTimestamp" DESC;
END;
$$ LANGUAGE plpgsql;