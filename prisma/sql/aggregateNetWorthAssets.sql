WITH latest_quantities AS (
  SELECT
    q.netWorthAssetId,
    q.quantity
  FROM NetWorthAssetQuantity q
  WHERE q.timestamp = (
    SELECT MAX(q2.timestamp)
    FROM NetWorthAssetQuantity q2
    WHERE q2.netWorthAssetId = q.netWorthAssetId
  )
),
latest_stock_prices AS (
  SELECT
    sp.tickerId,
    sp.price
  FROM StockPriceHistory sp
  WHERE sp.timestamp = (
    SELECT MAX(sp2.timestamp)
    FROM StockPriceHistory sp2
    WHERE sp2.tickerId = sp.tickerId
  )
),
latest_exchange_rates AS (
  SELECT
    er.baseCurrency,
    er.rate
  FROM ExchangeRate er
  WHERE er.quoteCurrency = ?  -- Placeholder for target currency (e.g., "EUR")
    AND er.timestamp = (
      SELECT MAX(er2.timestamp)
      FROM ExchangeRate er2
      WHERE er2.baseCurrency = er.baseCurrency
        AND er2.quoteCurrency = er.quoteCurrency
    )
)
SELECT
  SUM(
    (
      CASE 
        WHEN LOWER(a.type) = 'stock' THEN lq.quantity * IFNULL(lsp.price, 0)
        ELSE lq.quantity
      END
    ) *
    CASE 
      WHEN UPPER(a.currency) <> UPPER(?) THEN IFNULL(ler.rate, 1)
      ELSE 1
    END
  ) AS totalConvertedValue
FROM NetWorthAsset a
LEFT JOIN latest_quantities lq ON a.id = lq.netWorthAssetId
LEFT JOIN StockTicker st ON a.tickerId = st.id
LEFT JOIN latest_stock_prices lsp ON st.id = lsp.tickerId
LEFT JOIN latest_exchange_rates ler ON UPPER(a.currency) = ler.baseCurrency;