WITH latest_quantities AS (
  SELECT
    q.netWorthAssetId,
    q.quantity
  FROM NetWorthAssetQuantity q
  WHERE q.timestamp = (
    SELECT MAX(q2.timestamp)
    FROM NetWorthAssetQuantity q2
    WHERE q2.netWorthAssetId = q.netWorthAssetId
      AND q2.timestamp < DATE_ADD(?, INTERVAL 1 DAY)
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
      AND sp2.timestamp < DATE_ADD(?, INTERVAL 1 DAY)
  )
),
latest_debt_quantities AS (
  SELECT
    q.netWorthDebtId,
    q.quantity
  FROM NetWorthDebtQuantity q
  WHERE q.timestamp = (
    SELECT MAX(q2.timestamp)
    FROM NetWorthDebtQuantity q2
    WHERE q2.netWorthDebtId = q.netWorthDebtId
      AND q2.timestamp < DATE_ADD(?, INTERVAL 1 DAY)
  )
),
latest_exchange_rates AS (
  SELECT
    er.baseCurrency,
    er.rate
  FROM ExchangeRate er
  WHERE er.quoteCurrency = ?  -- targetCurrency
    AND er.timestamp = (
      SELECT MAX(er2.timestamp)
      FROM ExchangeRate er2
      WHERE er2.baseCurrency = er.baseCurrency
        AND er2.quoteCurrency = er.quoteCurrency
        AND er2.timestamp < DATE_ADD(?, INTERVAL 1 DAY)
    )
)
SELECT 
  (COALESCE(assetValue, 0) - COALESCE(debtValue, 0)) AS netWorth,
  COALESCE(assetValue, 0) AS totalAssets,
  COALESCE(debtValue, 0) AS totalDebts
FROM (
  SELECT 
    COALESCE(SUM(
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
    ), 0) AS assetValue
  FROM NetWorthAsset a
  LEFT JOIN latest_quantities lq ON a.id = lq.netWorthAssetId
  LEFT JOIN StockTicker st ON a.tickerId = st.id
  LEFT JOIN latest_stock_prices lsp ON st.id = lsp.tickerId
  LEFT JOIN latest_exchange_rates ler ON UPPER(a.currency) = ler.baseCurrency
) AS assets,
(
  SELECT 
    COALESCE(SUM(
      lqd.quantity *
      CASE 
        WHEN UPPER(d.currency) <> UPPER(?) THEN IFNULL(ler2.rate, 1)
        ELSE 1
      END
    ), 0) AS debtValue
  FROM NetWorthDebt d
  LEFT JOIN latest_debt_quantities lqd ON d.id = lqd.netWorthDebtId
  LEFT JOIN latest_exchange_rates ler2 ON UPPER(d.currency) = ler2.baseCurrency
) AS debts;