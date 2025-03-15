DROP PROCEDURE IF EXISTS updateCashFlowFromDate;
CREATE PROCEDURE updateCashFlowFromDate(
    IN inputDate DATE, 
    IN inputTargetCurrency VARCHAR(3),
    IN inputCreatedById VARCHAR(255)
)
BEGIN
  DECLARE d DATE;
  DECLARE today DATE;
  DECLARE v_currentMonthEnd DATE;
  DECLARE v_targetCurrency VARCHAR(3);
  DECLARE totalIncome DECIMAL(38,18);
  DECLARE totalExpenses DECIMAL(38,18);
  DECLARE netFlow DECIMAL(38,18);

  -- Initialize loop variables.
  SET d = inputDate;
  SET today = CURDATE();
  SET v_targetCurrency = inputTargetCurrency;

  WHILE d <= today DO
    -- Determine the end date for the current iteration.
    IF YEAR(d) = YEAR(today) AND MONTH(d) = MONTH(today) THEN
      SET v_currentMonthEnd = today;
    ELSE
      SET v_currentMonthEnd = LAST_DAY(d);
    END IF;

    -- Compute total income and expenses separately.
    WITH latest_exchange_rates AS (
        SELECT
          er.baseCurrency,
          er.rate
        FROM ExchangeRate er
        WHERE er.quoteCurrency COLLATE utf8mb4_unicode_ci = v_targetCurrency COLLATE utf8mb4_unicode_ci
          AND er.timestamp < DATE_ADD(v_currentMonthEnd, INTERVAL 1 DAY)
          AND er.timestamp = (
            SELECT MAX(er2.timestamp)
            FROM ExchangeRate er2
            WHERE er2.baseCurrency = er.baseCurrency
              AND er2.quoteCurrency COLLATE utf8mb4_unicode_ci = er.quoteCurrency COLLATE utf8mb4_unicode_ci
              AND er2.timestamp < DATE_ADD(v_currentMonthEnd, INTERVAL 1 DAY)
          )
    ),
    income_transactions AS (
        SELECT 
          COALESCE(SUM(
            t.amount * 
            CASE 
              WHEN UPPER(t.currency) COLLATE utf8mb4_unicode_ci <> UPPER(v_targetCurrency) COLLATE utf8mb4_unicode_ci
                THEN IFNULL(ler.rate, 1)
              ELSE 1
            END
          ), 0) AS totalIncome
        FROM Transaction t
        LEFT JOIN latest_exchange_rates ler ON UPPER(t.currency) COLLATE utf8mb4_unicode_ci = ler.baseCurrency COLLATE utf8mb4_unicode_ci
        WHERE t.createdById COLLATE utf8mb4_unicode_ci = inputCreatedById COLLATE utf8mb4_unicode_ci
          AND t.timestamp BETWEEN DATE_FORMAT(d, '%Y-%m-01') AND v_currentMonthEnd
          AND t.type = 'INCOME'
    ),
    expense_transactions AS (
        SELECT 
          COALESCE(SUM(
            t.amount * 
            CASE 
              WHEN UPPER(t.currency) COLLATE utf8mb4_unicode_ci <> UPPER(v_targetCurrency) COLLATE utf8mb4_unicode_ci
                THEN IFNULL(ler.rate, 1)
              ELSE 1
            END
          ), 0) AS totalExpenses
        FROM Transaction t
        LEFT JOIN latest_exchange_rates ler ON UPPER(t.currency) COLLATE utf8mb4_unicode_ci = ler.baseCurrency COLLATE utf8mb4_unicode_ci
        WHERE t.createdById COLLATE utf8mb4_unicode_ci = inputCreatedById COLLATE utf8mb4_unicode_ci
          AND t.timestamp BETWEEN DATE_FORMAT(d, '%Y-%m-01') AND v_currentMonthEnd
          AND t.type = 'EXPENSE'
    )
    SELECT 
        COALESCE(i.totalIncome, 0),
        COALESCE(e.totalExpenses, 0)
    INTO totalIncome, totalExpenses
    FROM income_transactions i, expense_transactions e;

    -- Calculate net cash flow
    SET netFlow = totalIncome - totalExpenses;

    -- For the current month, update or insert a record.
    IF YEAR(d) = YEAR(today) AND MONTH(d) = MONTH(today) THEN
      UPDATE CashFlow
      SET income = totalIncome,
          expenses = totalExpenses,
          netFlow = netFlow,
          updatedAt = NOW(),
          timestamp = today
      WHERE YEAR(timestamp) = YEAR(today) 
        AND MONTH(timestamp) = MONTH(today)
        AND createdById COLLATE utf8mb4_unicode_ci = inputCreatedById COLLATE utf8mb4_unicode_ci;
      IF ROW_COUNT() = 0 THEN
        INSERT INTO CashFlow (id, timestamp, income, expenses, netFlow, createdAt, updatedAt, createdById)
        VALUES (UUID(), today, totalIncome, totalExpenses, netFlow, NOW(), NOW(), inputCreatedById);
      END IF;
    ELSE
      -- For past months, upsert based on the unique timestamp (LAST_DAY of that month).
      INSERT INTO CashFlow (id, timestamp, income, expenses, netFlow, createdAt, updatedAt, createdById)
      VALUES (UUID(), v_currentMonthEnd, totalIncome, totalExpenses, netFlow, NOW(), NOW(), inputCreatedById)
      ON DUPLICATE KEY UPDATE
        income = VALUES(income),
        expenses = VALUES(expenses),
        netFlow = VALUES(netFlow),
        updatedAt = NOW();
    END IF;

    -- Move to the next month.
    SET d = DATE_ADD(LAST_DAY(d), INTERVAL 1 DAY);
  END WHILE;

  -- Return all CashFlow records for the period for the given user.
  SELECT * FROM CashFlow 
  WHERE timestamp BETWEEN inputDate AND today 
    AND createdById COLLATE utf8mb4_unicode_ci = inputCreatedById COLLATE utf8mb4_unicode_ci;
END;