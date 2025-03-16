CREATE OR REPLACE FUNCTION update_cash_flow_from_date(inputDate DATE, inputTargetCurrency VARCHAR(3), inputCreatedById VARCHAR(255)) RETURNS VOID AS $$
DECLARE
  d DATE;
  today DATE;
  v_currentMonthEnd DATE;
  v_targetCurrency VARCHAR(3);
  totalIncome DECIMAL(38,18);
  totalExpenses DECIMAL(38,18);
  netFlow DECIMAL(38,18);
BEGIN
  -- Initialize loop variables.
  d := inputDate;
  today := CURRENT_DATE;
  v_targetCurrency := inputTargetCurrency;

  LOOP
    EXIT WHEN d > today;

    -- Determine the end date for the current iteration.
    IF EXTRACT(YEAR FROM d) = EXTRACT(YEAR FROM today) AND EXTRACT(MONTH FROM d) = EXTRACT(MONTH FROM today) THEN
      v_currentMonthEnd := today;
    ELSE
      v_currentMonthEnd := DATE_TRUNC('MONTH', d) + INTERVAL '1 MONTH - 1 day';
    END IF;

    -- Compute total income and expenses separately.
    WITH latest_exchange_rates AS (
        SELECT
          "er"."baseCurrency",
          "er"."rate"
        FROM "ExchangeRate" "er"
        WHERE "er"."quoteCurrency" = v_targetCurrency
          AND "er"."timestamp" < v_currentMonthEnd + INTERVAL '1 DAY'
          AND "er"."timestamp" = (
            SELECT MAX("er2"."timestamp")
            FROM "ExchangeRate" "er2"
            WHERE "er2"."baseCurrency" = "er"."baseCurrency"
              AND "er2"."quoteCurrency" = "er"."quoteCurrency"
              AND "er2"."timestamp" < v_currentMonthEnd + INTERVAL '1 DAY'
          )
    ),
    income_transactions AS (
        SELECT 
          COALESCE(SUM(
            "t"."amount" * 
            CASE 
              WHEN UPPER("t"."currency") <> UPPER(v_targetCurrency)
                THEN COALESCE("ler"."rate", 1)
              ELSE 1
            END
          ), 0) AS totalIncome
        FROM "Transaction" "t"
        LEFT JOIN latest_exchange_rates "ler" ON UPPER("t"."currency") = "ler"."baseCurrency"
        WHERE "t"."createdById" = inputCreatedById
          AND "t"."timestamp" BETWEEN DATE_TRUNC('MONTH', d) AND v_currentMonthEnd
          AND "t"."type" = 'INCOME'
    ),
    expense_transactions AS (
        SELECT 
          COALESCE(SUM(
            "t"."amount" * 
            CASE 
              WHEN UPPER("t"."currency") <> UPPER(v_targetCurrency)
                THEN COALESCE("ler"."rate", 1)
              ELSE 1
            END
          ), 0) AS totalExpenses
        FROM "Transaction" "t"
        LEFT JOIN latest_exchange_rates "ler" ON UPPER("t"."currency") = "ler"."baseCurrency"
        WHERE "t"."createdById" = inputCreatedById
          AND "t"."timestamp" BETWEEN DATE_TRUNC('MONTH', d) AND v_currentMonthEnd
          AND "t"."type" = 'EXPENSE'
    )
    SELECT 
        COALESCE(i.totalIncome, 0),
        COALESCE(e.totalExpenses, 0)
    INTO totalIncome, totalExpenses
    FROM income_transactions i, expense_transactions e;

    -- Calculate net cash flow
    netFlow := totalIncome - totalExpenses;

    -- For the current month, update or insert a record.
    IF EXTRACT(YEAR FROM d) = EXTRACT(YEAR FROM today) AND EXTRACT(MONTH FROM d) = EXTRACT(MONTH FROM today) THEN
      UPDATE "CashFlow"
      SET "income" = totalIncome,
          "expenses" = totalExpenses,
          "netFlow" = netFlow,
          "updatedAt" = NOW(),
          "timestamp" = today
      WHERE EXTRACT(YEAR FROM "timestamp") = EXTRACT(YEAR FROM today) 
        AND EXTRACT(MONTH FROM "timestamp") = EXTRACT(MONTH FROM today)
        AND "createdById" = inputCreatedById;
      IF NOT FOUND THEN
        INSERT INTO "CashFlow" ("id", "timestamp", "income", "expenses", "netFlow", "createdAt", "updatedAt", "createdById")
        VALUES (gen_random_uuid(), today, totalIncome, totalExpenses, netFlow, NOW(), NOW(), inputCreatedById);
      END IF;
    ELSE
      -- For past months, upsert based on the unique timestamp (LAST_DAY of that month).
      INSERT INTO "CashFlow" ("id", "timestamp", "income", "expenses", "netFlow", "createdAt", "updatedAt", "createdById")
      VALUES (gen_random_uuid(), v_currentMonthEnd, totalIncome, totalExpenses, netFlow, NOW(), NOW(), inputCreatedById)
      ON CONFLICT DO UPDATE
        SET "income" = EXCLUDED."income",
            "expenses" = EXCLUDED."expenses",
            "netFlow" = EXCLUDED."netFlow",
            "updatedAt" = NOW();
    END IF;

    -- Move to the next month.
    d := DATE_TRUNC('MONTH', d) + INTERVAL '1 MONTH';
  END LOOP;

  -- Return all CashFlow records for the period for the given user.
  PERFORM * FROM "CashFlow" 
  WHERE "timestamp" BETWEEN inputDate AND today 
    AND "createdById" = inputCreatedById;
END $$ LANGUAGE plpgsql;