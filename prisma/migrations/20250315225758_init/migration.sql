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
