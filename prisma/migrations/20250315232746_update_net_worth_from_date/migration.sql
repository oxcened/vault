CREATE OR REPLACE FUNCTION update_net_worth_from_date(inputDate DATE, inputTargetCurrency VARCHAR(3), inputCreatedById VARCHAR(255)) RETURNS VOID AS $$
DECLARE 
    d DATE;
    today DATE;
    v_currentMonthEnd DATE;
    v_targetCurrency VARCHAR(3);
    netValue DECIMAL(38,18);
    totalAssets DECIMAL(38,18);
    totalDebts DECIMAL(38,18);
BEGIN
    -- Initialize loop variables.
    d := inputDate;
    today := CURRENT_DATE;
    v_targetCurrency := inputTargetCurrency;

    LOOP
        EXIT WHEN d > today;

        -- For the current month, use today; otherwise, use the last day of month.
        IF EXTRACT(YEAR FROM d) = EXTRACT(YEAR FROM today) AND EXTRACT(MONTH FROM d) = EXTRACT(MONTH FROM today) THEN
            v_currentMonthEnd := today;
        ELSE
            v_currentMonthEnd := DATE_TRUNC('MONTH', d) + INTERVAL '1 MONTH - 1 day';
        END IF;

        /*
          Compute net worth as of v_currentMonthEnd using CTEs.
          The WITH clause must be at the beginning of the statement.
        */
        WITH
          latest_quantities AS (
            SELECT
              q."netWorthAssetId",
              q."quantity"
            FROM "NetWorthAssetQuantity" q
            WHERE q."timestamp" < v_currentMonthEnd + INTERVAL '1 day'
              AND q."timestamp" = (
                SELECT MAX(q2."timestamp")
                FROM "NetWorthAssetQuantity" q2
                WHERE q2."netWorthAssetId" = q."netWorthAssetId"
                  AND q2."timestamp" < v_currentMonthEnd + INTERVAL '1 day'
              )
          ),
          latest_stock_prices AS (
            SELECT
              sp."tickerId",
              sp."price"
            FROM "StockPriceHistory" sp
            WHERE sp."timestamp" < v_currentMonthEnd + INTERVAL '1 day'
              AND sp."timestamp" = (
                SELECT MAX(sp2."timestamp")
                FROM "StockPriceHistory" sp2
                WHERE sp2."tickerId" = sp."tickerId"
                  AND sp2."timestamp" < v_currentMonthEnd + INTERVAL '1 day'
              )
          ),
          latest_debt_quantities AS (
            SELECT
              q."netWorthDebtId",
              q."quantity"
            FROM "NetWorthDebtQuantity" q
            WHERE q."timestamp" < v_currentMonthEnd + INTERVAL '1 day'
              AND q."timestamp" = (
                SELECT MAX(q2."timestamp")
                FROM "NetWorthDebtQuantity" q2
                WHERE q2."netWorthDebtId" = q."netWorthDebtId"
                  AND q2."timestamp" < v_currentMonthEnd + INTERVAL '1 day'
              )
          ),
          latest_exchange_rates AS (
            SELECT
              er."baseCurrency",
              er."rate"
            FROM "ExchangeRate" er
            WHERE er."quoteCurrency" = v_targetCurrency
              AND er."timestamp" < v_currentMonthEnd + INTERVAL '1 day'
              AND er."timestamp" = (
                SELECT MAX(er2."timestamp")
                FROM "ExchangeRate" er2
                WHERE er2."baseCurrency" = er."baseCurrency"
                  AND er2."quoteCurrency" = er."quoteCurrency"
                  AND er2."timestamp" < v_currentMonthEnd + INTERVAL '1 day'
              )
          )
        SELECT 
          (COALESCE(assetValue, 0) - COALESCE(debtValue, 0)) AS "netWorth",
          COALESCE(assetValue, 0) AS "totalAssets",
          COALESCE(debtValue, 0) AS "totalDebts"
        INTO netValue, totalAssets, totalDebts
        FROM (
          SELECT 
            SUM(
              (
                CASE 
                  WHEN nc."isStock" 
                    THEN lq."quantity" * COALESCE(lsp."price", 0)
                  ELSE lq."quantity"
                END
              ) *
              CASE 
                WHEN UPPER(a."currency") <> UPPER(v_targetCurrency)
                  THEN COALESCE(ler."rate", 1)
                ELSE 1
              END
            ) AS assetValue
          FROM "NetWorthAsset" a
          JOIN "NetWorthCategory" nc ON a."categoryId" = nc."id"
          LEFT JOIN latest_quantities lq ON a."id" = lq."netWorthAssetId"
          LEFT JOIN "StockTicker" st ON a."tickerId" = st."id"
          LEFT JOIN latest_stock_prices lsp ON st."id" = lsp."tickerId"
          LEFT JOIN latest_exchange_rates ler ON UPPER(a."currency") = ler."baseCurrency"
          WHERE a."createdById" = inputCreatedById
        ) AS assets,
        (
          SELECT 
            SUM(
              lqd."quantity" *
              CASE 
                WHEN UPPER(d."currency") <> UPPER(v_targetCurrency)
                  THEN COALESCE(ler2."rate", 1)
                ELSE 1
              END
            ) AS debtValue
          FROM "NetWorthDebt" d
          JOIN "NetWorthCategory" nc ON d."categoryId" = nc."id"
          LEFT JOIN latest_debt_quantities lqd ON d."id" = lqd."netWorthDebtId"
          LEFT JOIN latest_exchange_rates ler2 ON UPPER(d."currency") = ler2."baseCurrency"
          WHERE d."createdById" = inputCreatedById
        ) AS debts;

        -- For the current month, update or insert the record.
        IF EXTRACT(YEAR FROM d) = EXTRACT(YEAR FROM today) AND EXTRACT(MONTH FROM d) = EXTRACT(MONTH FROM today) THEN
            UPDATE "NetWorth"
            SET "totalAssets" = totalAssets,
                "totalDebts" = totalDebts,
                "netValue" = netValue,
                "updatedAt" = NOW(),
                "timestamp" = today
            WHERE EXTRACT(YEAR FROM "timestamp") = EXTRACT(YEAR FROM today) 
              AND EXTRACT(MONTH FROM "timestamp") = EXTRACT(MONTH FROM today)
              AND "createdById" = inputCreatedById;
            IF NOT FOUND THEN
                INSERT INTO "NetWorth" ("id", "totalAssets", "totalDebts", "netValue", "timestamp", "createdAt", "updatedAt", "createdById")
                VALUES (gen_random_uuid(), totalAssets, totalDebts, netValue, today, NOW(), NOW(), inputCreatedById);
            END IF;
        ELSE
            -- For past months, upsert based on the unique timestamp (LAST_DAY of that month).
            INSERT INTO "NetWorth" ("id", "totalAssets", "totalDebts", "netValue", "timestamp", "createdAt", "updatedAt", "createdById")
            VALUES (gen_random_uuid(), totalAssets, totalDebts, netValue, v_currentMonthEnd, NOW(), NOW(), inputCreatedById)
            ON CONFLICT ("timestamp", "createdById") DO UPDATE SET
                "totalAssets" = EXCLUDED."totalAssets",
                "totalDebts"  = EXCLUDED."totalDebts",
                "netValue"    = EXCLUDED."netValue",
                "updatedAt"   = NOW();
        END IF;

        -- Advance to the first day of the next month.
        d := DATE_TRUNC('MONTH', d) + INTERVAL '1 MONTH';
    END LOOP;

    -- Return all NetWorth records for the period for the given user.
    PERFORM * FROM "NetWorth" 
    WHERE "timestamp" BETWEEN inputDate AND today 
      AND "createdById" = inputCreatedById;
END $$ LANGUAGE plpgsql;