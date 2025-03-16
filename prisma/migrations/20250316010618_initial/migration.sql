-- CreateEnum
CREATE TYPE "NetWorthCategoryType" AS ENUM ('ASSET', 'DEBT', 'BOTH');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "NetWorth" (
    "id" TEXT NOT NULL,
    "totalAssets" DECIMAL(38,18) NOT NULL,
    "totalDebts" DECIMAL(38,18) NOT NULL,
    "netValue" DECIMAL(38,18) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "NetWorth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "NetWorthCategoryType" NOT NULL,
    "isStock" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NetWorthCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tickerId" TEXT,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "NetWorthAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthAssetQuantity" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "quantityFormula" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "netWorthAssetId" TEXT NOT NULL,

    CONSTRAINT "NetWorthAssetQuantity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthDebt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "NetWorthDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthDebtQuantity" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "quantityFormula" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "netWorthDebtId" TEXT NOT NULL,

    CONSTRAINT "NetWorthDebtQuantity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTicker" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "StockTicker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockPriceHistory" (
    "id" TEXT NOT NULL,
    "tickerId" TEXT NOT NULL,
    "price" DECIMAL(38,18) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "quoteCurrency" TEXT NOT NULL,
    "rate" DECIMAL(38,18) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "currency" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "categoryId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashFlow" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "income" DECIMAL(38,18) NOT NULL,
    "expenses" DECIMAL(38,18) NOT NULL,
    "netFlow" DECIMAL(38,18) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashFlow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "NetWorth_timestamp_idx" ON "NetWorth"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "NetWorth_timestamp_key" ON "NetWorth"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "NetWorthCategory_name_key" ON "NetWorthCategory"("name");

-- CreateIndex
CREATE INDEX "NetWorthAssetQuantity_netWorthAssetId_timestamp_idx" ON "NetWorthAssetQuantity"("netWorthAssetId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "NetWorthAssetQuantity_netWorthAssetId_timestamp_key" ON "NetWorthAssetQuantity"("netWorthAssetId", "timestamp");

-- CreateIndex
CREATE INDEX "NetWorthDebtQuantity_netWorthDebtId_timestamp_idx" ON "NetWorthDebtQuantity"("netWorthDebtId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "NetWorthDebtQuantity_netWorthDebtId_timestamp_key" ON "NetWorthDebtQuantity"("netWorthDebtId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "StockTicker_ticker_exchange_key" ON "StockTicker"("ticker", "exchange");

-- CreateIndex
CREATE INDEX "StockPriceHistory_tickerId_timestamp_idx" ON "StockPriceHistory"("tickerId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "StockPriceHistory_tickerId_timestamp_key" ON "StockPriceHistory"("tickerId", "timestamp");

-- CreateIndex
CREATE INDEX "ExchangeRate_baseCurrency_quoteCurrency_timestamp_idx" ON "ExchangeRate"("baseCurrency", "quoteCurrency", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_baseCurrency_quoteCurrency_timestamp_key" ON "ExchangeRate"("baseCurrency", "quoteCurrency", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCategory_name_key" ON "TransactionCategory"("name");

-- CreateIndex
CREATE INDEX "CashFlow_timestamp_idx" ON "CashFlow"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "CashFlow_timestamp_key" ON "CashFlow"("timestamp");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorth" ADD CONSTRAINT "NetWorth_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorthAsset" ADD CONSTRAINT "NetWorthAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorthAsset" ADD CONSTRAINT "NetWorthAsset_tickerId_fkey" FOREIGN KEY ("tickerId") REFERENCES "StockTicker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorthAsset" ADD CONSTRAINT "NetWorthAsset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NetWorthCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorthAssetQuantity" ADD CONSTRAINT "NetWorthAssetQuantity_netWorthAssetId_fkey" FOREIGN KEY ("netWorthAssetId") REFERENCES "NetWorthAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorthDebt" ADD CONSTRAINT "NetWorthDebt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorthDebt" ADD CONSTRAINT "NetWorthDebt_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NetWorthCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorthDebtQuantity" ADD CONSTRAINT "NetWorthDebtQuantity_netWorthDebtId_fkey" FOREIGN KEY ("netWorthDebtId") REFERENCES "NetWorthDebt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockPriceHistory" ADD CONSTRAINT "StockPriceHistory_tickerId_fkey" FOREIGN KEY ("tickerId") REFERENCES "StockTicker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TransactionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- Insert predefined net worth categories
INSERT INTO "NetWorthCategory" ("id", "name", "type", "isStock") VALUES
  ('cm8ax61ed001n3b6ll152wkul', 'Cash', 'ASSET', false),
  ('cm8ax7d0k00313b6lvlk17gl8', 'Bank Accounts', 'ASSET', false),
  ('cm8ax7f5500333b6lrtmq5zdj', 'Stocks', 'ASSET', true),
  ('cm8ax7j1q00373b6ll997pdhq', 'Bonds', 'ASSET', false),
  ('cm8ax7h5j00353b6l2bh3i7hz', 'Retirement Accounts', 'ASSET', false),
  ('ckh4g1g1g0005u7v6c7j9g1b7', 'Real Estate', 'ASSET', false),
  ('cm8ax7ktm00393b6ln0ix5s3g', 'Vehicles', 'ASSET', false),
  ('cm8ax7mzq003b3b6lnmemhhay', 'Collectibles', 'ASSET', false),
  ('cm8ax66iq001p3b6lyzkzoeik', 'Business Interests', 'ASSET', false),
  ('cm8ax69fy001r3b6l4b6g8itm', 'Intellectual Property', 'ASSET', false),
  ('cm8ax6c0w001t3b6l1sqlzpi6', 'Other', 'BOTH', false),
  ('cm8ax6dt9001v3b6ly9bfyl1r', 'Mortgage', 'DEBT', false),
  ('cm8ax6g1h001x3b6l08i2duym', 'Home Equity Loans/HELOC', 'DEBT', false),
  ('cm8ax6hwp001z3b6lduy1cq7c', 'Car Loans', 'DEBT', false),
  ('cm8ax6jk400213b6lampdjxlb', 'Auto Leases', 'DEBT', false),
  ('cm8ax6zry002f3b6lvbvb3yzg', 'Student Loans', 'DEBT', false),
  ('cm8ax6ura002b3b6lsrupi9uy', 'Credit Cards', 'DEBT', false),
  ('cm8ax8etu003f3b6l4kn3kcgb', 'Personal Loans', 'DEBT', false),
  ('cm8ax6smt00293b6lp8oqn6w6', 'Retail Financing', 'DEBT', false),
  ('cm8ax75uv002n3b6lypwyg45n', 'Business Loans', 'DEBT', false),
  ('cm8ax780z002r3b6lva0t6f0g', 'Medical Debt', 'DEBT', false),
  ('cm8ax6qmy00273b6lzok47v9d', 'Tax Liabilities', 'DEBT', false),
  ('cm8ax720l002h3b6lgv5yyt4b', 'Short-term Debt', 'DEBT', false)
ON CONFLICT ("name") DO NOTHING;

-- Insert predefined transaction categories
INSERT INTO "TransactionCategory" ("id", "name", "createdAt", "updatedAt") VALUES
  ('cm8ax41c700013b6lt314dmwz', 'Housing', NOW(), NOW()),
  ('cm8ax4hhq00033b6lb65nska8', 'Personal Care', NOW(), NOW()),
  ('cm8ax4jxk00053b6l2ol9yn96', 'Groceries & Household', NOW(), NOW()),
  ('cm8ax4mob00073b6ld1v6ypv9', 'Transport & Mobility', NOW(), NOW()),
  ('cm8ax4osz00093b6lakgti7bj', 'Eating Out & Bars', NOW(), NOW()),
  ('cm8ax4rix000b3b6l8ipg9qdd', 'Travel & Holidays', NOW(), NOW()),
  ('cm8ax4ugy000d3b6lxsfjt8e8', 'Shopping', NOW(), NOW()),
  ('cm8ax4wia000f3b6lt3ugtp6i', 'Leisure & Entertainment', NOW(), NOW()),
  ('cm8ax57vp000n3b6lqqpkmgrh', 'Gifts & Donations', NOW(), NOW()),
  ('cm8ax52xq000l3b6le9ouj3db', 'Financial Fees & Charges', NOW(), NOW()),
  ('cm8ax5b0k000p3b6l9jtyrmz8', 'Taxes & Contributions', NOW(), NOW()),
  ('cm8ax5d41000r3b6lr3its2br', 'Other & Unexpected', NOW(), NOW()),
  
  ('cm8ax5n1y001d3b6lr4jlt4ov', 'Salary & Wages', NOW(), NOW()),
  ('cm8ax5kbf00193b6l5jtjuue6', 'Freelance & Side Hustles', NOW(), NOW()),
  ('cm8ax5pf4001f3b6ldct9ukg3', 'Business Income', NOW(), NOW()),
  ('cm8ax5s2c001h3b6l6klqp4x1', 'Investments & Dividends', NOW(), NOW()),
  ('cm8ax5u3a001j3b6l69hwl07i', 'Pension & Retirement Income', NOW(), NOW()),
  ('cm8ax5vyj001l3b6lk7vuzvfq', 'Rental Income', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;