WITH latest_debt_quantities AS (
  SELECT
    q."netWorthDebtId",
    q."quantity"
  FROM "NetWorthDebtQuantity" q
  WHERE q."timestamp" = (
    SELECT MAX(q2."timestamp")
    FROM "NetWorthDebtQuantity" q2
    WHERE q2."netWorthDebtId" = q."netWorthDebtId"
  )
),
latest_exchange_rates AS (
  SELECT
    er."baseCurrency",
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
  d."id",
  d."name",
  c."name" AS "category",
  d."currency",
  ldq."quantity" AS "quantity",
  ldq."quantity" AS "nativeValue",
  CASE 
    WHEN UPPER(d."currency") != UPPER($2) THEN ldq."quantity" * COALESCE(ler."rate", 1)
    ELSE ldq."quantity"
  END AS "convertedValue"
FROM "NetWorthDebt" d
JOIN "NetWorthCategory" c ON d."categoryId" = c."id"
LEFT JOIN latest_debt_quantities ldq ON d."id" = ldq."netWorthDebtId"
LEFT JOIN latest_exchange_rates ler ON UPPER(d."currency") = ler."baseCurrency"
WHERE d."createdById" = $3  -- Filter debts by the specific user
  AND c."type" IN ('DEBT', 'BOTH')  -- Ensures only relevant debt categories are included
ORDER BY "d"."createdAt" ASC;