DROP PROCEDURE IF EXISTS updateFromDate;
CREATE PROCEDURE updateFromDate(IN inputDate DATE, IN inputTargetCurrency VARCHAR(3))
BEGIN
  DECLARE d DATE;
  DECLARE today DATE;
  DECLARE v_currentMonthEnd DATE;
  DECLARE v_targetCurrency VARCHAR(3);
  DECLARE netValue DECIMAL(38,18);
  DECLARE totalAssets DECIMAL(38,18);
  DECLARE totalDebts DECIMAL(38,18);

  -- Initialize loop variables.
  SET d = inputDate;
  SET today = CURDATE();
  SET v_targetCurrency = inputTargetCurrency;

  WHILE d <= today DO
    -- For the current month, use today; otherwise, use the last day of month.
    IF YEAR(d) = YEAR(today) AND MONTH(d) = MONTH(today) THEN
      SET v_currentMonthEnd = today;
    ELSE
      SET v_currentMonthEnd = LAST_DAY(d);
    END IF;

    /*
      Compute net worth as of v_currentMonthEnd using CTEs.
      The WITH clause must be at the beginning of the statement.
      All string comparisons are forced to the same collation.
    */
    WITH
      latest_quantities AS (
        SELECT
          q.netWorthAssetId,
          q.quantity
        FROM NetWorthAssetQuantity q
        WHERE q.timestamp < DATE_ADD(v_currentMonthEnd, INTERVAL 1 DAY)
          AND q.timestamp = (
            SELECT MAX(q2.timestamp)
            FROM NetWorthAssetQuantity q2
            WHERE q2.netWorthAssetId = q.netWorthAssetId
              AND q2.timestamp < DATE_ADD(v_currentMonthEnd, INTERVAL 1 DAY)
          )
      ),
      latest_stock_prices AS (
        SELECT
          sp.tickerId,
          sp.price
        FROM StockPriceHistory sp
        WHERE sp.timestamp < DATE_ADD(v_currentMonthEnd, INTERVAL 1 DAY)
          AND sp.timestamp = (
            SELECT MAX(sp2.timestamp)
            FROM StockPriceHistory sp2
            WHERE sp2.tickerId = sp.tickerId
              AND sp2.timestamp < DATE_ADD(v_currentMonthEnd, INTERVAL 1 DAY)
          )
      ),
      latest_debt_quantities AS (
        SELECT
          q.netWorthDebtId,
          q.quantity
        FROM NetWorthDebtQuantity q
        WHERE q.timestamp < DATE_ADD(v_currentMonthEnd, INTERVAL 1 DAY)
          AND q.timestamp = (
            SELECT MAX(q2.timestamp)
            FROM NetWorthDebtQuantity q2
            WHERE q2.netWorthDebtId = q.netWorthDebtId
              AND q2.timestamp < DATE_ADD(v_currentMonthEnd, INTERVAL 1 DAY)
          )
      ),
      latest_exchange_rates AS (
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
      )
    SELECT 
      (COALESCE(assetValue, 0) - COALESCE(debtValue, 0)) AS netWorth,
      COALESCE(assetValue, 0) AS totalAssets,
      COALESCE(debtValue, 0) AS totalDebts
    INTO netValue, totalAssets, totalDebts
    FROM (
      SELECT 
        SUM(
          (
            CASE 
              WHEN LOWER(a.category) = 'stocks' 
                THEN lq.quantity * IFNULL(lsp.price, 0)
              ELSE lq.quantity
            END
          ) *
          CASE 
            WHEN UPPER(a.currency) COLLATE utf8mb4_unicode_ci <> UPPER(v_targetCurrency) COLLATE utf8mb4_unicode_ci
              THEN IFNULL(ler.rate, 1)
            ELSE 1
          END
        ) AS assetValue
      FROM NetWorthAsset a
      LEFT JOIN latest_quantities lq ON a.id = lq.netWorthAssetId
      LEFT JOIN StockTicker st ON a.tickerId = st.id
      LEFT JOIN latest_stock_prices lsp ON st.id = lsp.tickerId
      LEFT JOIN latest_exchange_rates ler ON UPPER(a.currency) COLLATE utf8mb4_unicode_ci = ler.baseCurrency COLLATE utf8mb4_unicode_ci
    ) AS assets,
    (
      SELECT 
        SUM(
          lqd.quantity *
          CASE 
            WHEN UPPER(d.currency) COLLATE utf8mb4_unicode_ci <> UPPER(v_targetCurrency) COLLATE utf8mb4_unicode_ci
              THEN IFNULL(ler2.rate, 1)
            ELSE 1
          END
        ) AS debtValue
      FROM NetWorthDebt d
      LEFT JOIN latest_debt_quantities lqd ON d.id = lqd.netWorthDebtId
      LEFT JOIN latest_exchange_rates ler2 ON UPPER(d.currency) COLLATE utf8mb4_unicode_ci = ler2.baseCurrency COLLATE utf8mb4_unicode_ci
    ) AS debts;

    -- For the current month, update any existing record in the month (regardless of its day).
    IF YEAR(d) = YEAR(today) AND MONTH(d) = MONTH(today) THEN
      UPDATE NetWorth
      SET totalAssets = totalAssets,
          totalDebts = totalDebts,
          netValue = netValue,
          updatedAt = NOW(),
          timestamp = today
      WHERE YEAR(timestamp) = YEAR(today) AND MONTH(timestamp) = MONTH(today);
      IF ROW_COUNT() = 0 THEN
        INSERT INTO NetWorth (id, totalAssets, totalDebts, netValue, timestamp, createdAt, updatedAt)
        VALUES (UUID(), totalAssets, totalDebts, netValue, today, NOW(), NOW());
      END IF;
    ELSE
      -- For past months, upsert based on the unique timestamp (LAST_DAY of that month).
      INSERT INTO NetWorth (id, totalAssets, totalDebts, netValue, timestamp, createdAt, updatedAt)
      VALUES (UUID(), totalAssets, totalDebts, netValue, v_currentMonthEnd, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        totalAssets = VALUES(totalAssets),
        totalDebts  = VALUES(totalDebts),
        netValue    = VALUES(netValue),
        updatedAt   = NOW();
    END IF;

    -- Advance to the first day of the next month.
    SET d = DATE_ADD(LAST_DAY(d), INTERVAL 1 DAY);
  END WHILE;

  -- Return all NetWorth records for the period.
  SELECT * FROM NetWorth WHERE timestamp BETWEEN inputDate AND today;
END;