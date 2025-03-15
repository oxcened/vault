WITH debt_info AS (
  SELECT 
    d.id, 
    d.categoryId, 
    c.name AS category, 
    d.currency
  FROM NetWorthDebt d
  JOIN NetWorthCategory c ON d.categoryId = c.id
  WHERE d.id = ?
),
date_series AS (
  -- Generate distinct dates from the debt quantity records.
  SELECT DISTINCT DATE(ts) AS day
  FROM (
    SELECT q.timestamp AS ts
    FROM NetWorthDebtQuantity q
    WHERE q.netWorthDebtId = (SELECT id FROM debt_info)
  ) t
),
daily_exchange_rates AS (
  -- For each day, get the latest exchange rate (if any) for converting debt currency to the target.
  SELECT 
    ds.day,
    (
      SELECT er.rate
      FROM ExchangeRate er
      WHERE er.baseCurrency = UPPER((SELECT currency FROM debt_info))
        AND er.quoteCurrency = UPPER(?)
        AND er.timestamp <= ds.day
      ORDER BY er.timestamp DESC
      LIMIT 1
    ) AS exRate
  FROM date_series ds
),
daily_data AS (
  SELECT 
    ds.day,
    -- For each day, get the latest available debt quantity record (its value, id, and timestamp) with timestamp ≤ the day.
    (
      SELECT q.quantity
      FROM NetWorthDebtQuantity q
      WHERE q.netWorthDebtId = (SELECT id FROM debt_info)
        AND q.timestamp <= ds.day
      ORDER BY q.timestamp DESC
      LIMIT 1
    ) AS lastQuantity,
    (
      SELECT q.id
      FROM NetWorthDebtQuantity q
      WHERE q.netWorthDebtId = (SELECT id FROM debt_info)
        AND q.timestamp <= ds.day
      ORDER BY q.timestamp DESC
      LIMIT 1
    ) AS quantityId,
    (
      SELECT q.timestamp
      FROM NetWorthDebtQuantity q
      WHERE q.netWorthDebtId = (SELECT id FROM debt_info)
        AND q.timestamp <= ds.day
      ORDER BY q.timestamp DESC
      LIMIT 1
    ) AS quantityTimestamp
  FROM date_series ds
)
SELECT 
  dd.day AS timestamp,
  dd.lastQuantity AS quantity,
  dd.quantityId,
  dd.quantityTimestamp,
  -- Native computed value: for debts, we simply use the latest quantity.
  IFNULL(dd.lastQuantity, 0) AS nativeComputedValue,
  (SELECT currency FROM debt_info) AS currency,
  -- Converted computed value: if debt currency differs from target, multiply native value by the exchange rate; otherwise, use native value.
  CASE 
    WHEN UPPER((SELECT currency FROM debt_info)) <> UPPER(?)
      THEN IFNULL(dd.lastQuantity, 0) * IFNULL(de.exRate, 1)
    ELSE 
      IFNULL(dd.lastQuantity, 0)
  END AS computedValue
FROM daily_data dd
LEFT JOIN daily_exchange_rates de ON dd.day = de.day
WHERE dd.lastQuantity IS NOT NULL
  AND dd.lastQuantity <> 0
ORDER BY dd.day DESC;