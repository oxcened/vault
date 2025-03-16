WITH latest_quantities AS (
  SELECT
    q."netWorthAssetId",
    q."quantity"
  FROM "NetWorthAssetQuantity" q
  WHERE q."timestamp" = (
    SELECT MAX(q2."timestamp")
    FROM "NetWorthAssetQuantity" q2
    WHERE q2."netWorthAssetId" = q."netWorthAssetId"
  )
),
latest_stock_prices AS (
  SELECT
    sp."tickerId",
    sp."price"
  FROM "StockPriceHistory" sp
  WHERE sp."timestamp" = (
    SELECT MAX(sp2."timestamp")
    FROM "StockPriceHistory" sp2
    WHERE sp2."tickerId" = sp."tickerId"
  )
),
latest_exchange_rates AS (
  SELECT
    er."baseCurrency",  -- asset currency becomes the base currency
    er."rate"
  FROM "ExchangeRate" er
  WHERE er."quoteCurrency" = $1  -- Placeholder for target currency (e.g., "EUR")
    AND er."timestamp" = (
      SELECT MAX(er2."timestamp")
      FROM "ExchangeRate" er2
      WHERE er2."baseCurrency" = er."baseCurrency"
        AND er2."quoteCurrency" = er."quoteCurrency"
    )
)
SELECT 
  a."id",
  a."name",
  c."name" AS "category",
  a."currency",
  st."ticker" AS "ticker",
  st."exchange" AS "exchange",
  st."name" AS "stockName",
  lq."quantity" AS "quantity",
  lsp."price" AS "stockPrice",
  CASE
    WHEN c."isStock" THEN lq."quantity" * COALESCE(lsp."price", 0)
    ELSE lq."quantity"
  END AS "nativeValue",
  CASE 
    WHEN UPPER(a."currency") != UPPER($2) THEN 
      (CASE 
         WHEN c."isStock" THEN lq."quantity" * COALESCE(lsp."price", 0)
         ELSE lq."quantity"
       END) * COALESCE(ler."rate", 1)
    ELSE 
      CASE 
        WHEN c."isStock" THEN lq."quantity" * COALESCE(lsp."price", 0)
        ELSE lq."quantity"
      END
  END AS "convertedValue"
FROM "NetWorthAsset" a
JOIN "NetWorthCategory" c ON a."categoryId" = c."id"
LEFT JOIN latest_quantities lq ON a."id" = lq."netWorthAssetId"
LEFT JOIN "StockTicker" st ON a."tickerId" = st."id"
LEFT JOIN latest_stock_prices lsp ON st."id" = lsp."tickerId"
LEFT JOIN latest_exchange_rates ler ON UPPER(a."currency") = UPPER(ler."baseCurrency")
WHERE a."createdById" = $3  
  AND c."type" IN ('ASSET', 'BOTH')
ORDER BY a."createdAt" ASC;