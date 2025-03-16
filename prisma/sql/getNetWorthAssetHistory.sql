WITH "asset_info" AS (
  SELECT 
    a."id", 
    a."categoryId",
    c."name" AS "category", 
    a."tickerId", 
    a."currency"
  FROM "NetWorthAsset" a
  JOIN "NetWorthCategory" c ON a."categoryId" = c."id"
  WHERE a."id" = $1
),
"date_series" AS (
  -- Generate a distinct set of dates (normalized to midnight) from price and quantity records.
  SELECT DISTINCT CAST(ts AS DATE) AS "day"
  FROM (
    SELECT sp."timestamp" AS ts
    FROM "StockPriceHistory" sp
    WHERE sp."tickerId" = (SELECT "tickerId" FROM "asset_info")
    UNION ALL
    SELECT q."timestamp" AS ts
    FROM "NetWorthAssetQuantity" q
    WHERE q."netWorthAssetId" = (SELECT "id" FROM "asset_info")
  ) t
),
"daily_exchange_rates" AS (
  -- For each day, get the latest exchange rate (if any) for converting asset currency to the target.
  SELECT 
    ds."day",
    (
      SELECT er."rate"
      FROM "ExchangeRate" er
      WHERE er."baseCurrency" = UPPER((SELECT "currency" FROM "asset_info"))
        AND er."quoteCurrency" = UPPER($2)
        AND er."timestamp" <= ds."day"
      ORDER BY er."timestamp" DESC
      LIMIT 1
    ) AS "exRate"
  FROM "date_series" ds
),
"daily_data" AS (
  SELECT 
    ds."day",
    -- For stock assets, get the latest price record (price and its id) with timestamp ≤ the day.
    CASE 
      WHEN (SELECT c."isStock" FROM "NetWorthCategory" c WHERE c."id" = (SELECT "categoryId" FROM "asset_info"))
      THEN (
        SELECT sp."price"
        FROM "StockPriceHistory" sp
        WHERE sp."tickerId" = (SELECT "tickerId" FROM "asset_info")
          AND sp."timestamp" <= ds."day"
        ORDER BY sp."timestamp" DESC
        LIMIT 1
      )
      ELSE NULL
    END AS "stockPrice",
    CASE 
      WHEN (SELECT c."isStock" FROM "NetWorthCategory" c WHERE c."id" = (SELECT "categoryId" FROM "asset_info"))
      THEN (
        SELECT sp."id"
        FROM "StockPriceHistory" sp
        WHERE sp."tickerId" = (SELECT "tickerId" FROM "asset_info")
          AND sp."timestamp" <= ds."day"
        ORDER BY sp."timestamp" DESC
        LIMIT 1
      )
      ELSE NULL
    END AS "stockPriceId",
    -- For each day, get the latest available quantity record (its value, id, and timestamp) with timestamp ≤ the day.
    (
      SELECT q."quantity"
      FROM "NetWorthAssetQuantity" q
      WHERE q."netWorthAssetId" = (SELECT "id" FROM "asset_info")
        AND q."timestamp" <= ds."day"
      ORDER BY q."timestamp" DESC
      LIMIT 1
    ) AS "lastQuantity",
    (
      SELECT q."id"
      FROM "NetWorthAssetQuantity" q
      WHERE q."netWorthAssetId" = (SELECT "id" FROM "asset_info")
        AND q."timestamp" <= ds."day"
      ORDER BY q."timestamp" DESC
      LIMIT 1
    ) AS "quantityId",
    (
      SELECT q."timestamp"
      FROM "NetWorthAssetQuantity" q
      WHERE q."netWorthAssetId" = (SELECT "id" FROM "asset_info")
        AND q."timestamp" <= ds."day"
      ORDER BY q."timestamp" DESC
      LIMIT 1
    ) AS "quantityTimestamp"
  FROM "date_series" ds
)
SELECT 
  dd."day" AS "timestamp",
  dd."stockPrice",
  dd."stockPriceId",
  dd."lastQuantity" AS "quantity",
  dd."quantityId",
  dd."quantityTimestamp",
  -- Native computed value: for stocks, quantity * stockPrice; for others, just quantity.
  CASE 
    WHEN (SELECT c."isStock" FROM "NetWorthCategory" c WHERE c."id" = (SELECT "categoryId" FROM "asset_info"))
      THEN COALESCE(dd."lastQuantity", 0) * COALESCE(dd."stockPrice", 0)
    ELSE COALESCE(dd."lastQuantity", 0)
  END AS "nativeComputedValue",
  (SELECT "currency" FROM "asset_info") AS "currency",
  -- Converted computed value: if asset currency differs from target, multiply native value by the exchange rate; else, use native value.
  CASE 
    WHEN UPPER((SELECT "currency" FROM "asset_info")) != UPPER($3)
      THEN (
          CASE 
            WHEN (SELECT c."isStock" FROM "NetWorthCategory" c WHERE c."id" = (SELECT "categoryId" FROM "asset_info"))
              THEN COALESCE(dd."lastQuantity", 0) * COALESCE(dd."stockPrice", 0)
            ELSE COALESCE(dd."lastQuantity", 0)
          END
        ) * COALESCE(de."exRate", 1)
    ELSE 
      CASE 
          WHEN (SELECT c."isStock" FROM "NetWorthCategory" c WHERE c."id" = (SELECT "categoryId" FROM "asset_info"))
            THEN COALESCE(dd."lastQuantity", 0) * COALESCE(dd."stockPrice", 0)
          ELSE COALESCE(dd."lastQuantity", 0)
      END
  END AS "computedValue"
FROM "daily_data" dd
LEFT JOIN "daily_exchange_rates" de ON dd."day" = de."day"
WHERE dd."lastQuantity" IS NOT NULL
  AND dd."lastQuantity" != 0
ORDER BY dd."day" DESC;