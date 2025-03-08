-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` VARCHAR(191) NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` VARCHAR(191) NULL,
    `session_state` VARCHAR(191) NULL,
    `refresh_token_expires_in` INTEGER NULL,

    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NetWorth` (
    `id` VARCHAR(191) NOT NULL,
    `totalAssets` DECIMAL(38, 18) NOT NULL,
    `totalDebts` DECIMAL(38, 18) NOT NULL,
    `netValue` DECIMAL(38, 18) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `NetWorth_timestamp_idx`(`timestamp`),
    UNIQUE INDEX `NetWorth_timestamp_key`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NetWorthAsset` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `tickerId` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NetWorthAssetQuantity` (
    `id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(38, 18) NOT NULL,
    `quantityFormula` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `netWorthAssetId` VARCHAR(191) NOT NULL,

    INDEX `NetWorthAssetQuantity_netWorthAssetId_timestamp_idx`(`netWorthAssetId`, `timestamp`),
    UNIQUE INDEX `NetWorthAssetQuantity_netWorthAssetId_timestamp_key`(`netWorthAssetId`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NetWorthDebt` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NetWorthDebtQuantity` (
    `id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(38, 18) NOT NULL,
    `quantityFormula` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `netWorthDebtId` VARCHAR(191) NOT NULL,

    INDEX `NetWorthDebtQuantity_netWorthDebtId_timestamp_idx`(`netWorthDebtId`, `timestamp`),
    UNIQUE INDEX `NetWorthDebtQuantity_netWorthDebtId_timestamp_key`(`netWorthDebtId`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockTicker` (
    `id` VARCHAR(191) NOT NULL,
    `ticker` VARCHAR(191) NOT NULL,
    `exchange` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `StockTicker_ticker_exchange_key`(`ticker`, `exchange`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockPriceHistory` (
    `id` VARCHAR(191) NOT NULL,
    `tickerId` VARCHAR(191) NOT NULL,
    `price` DECIMAL(38, 18) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,

    INDEX `StockPriceHistory_tickerId_timestamp_idx`(`tickerId`, `timestamp`),
    UNIQUE INDEX `StockPriceHistory_tickerId_timestamp_key`(`tickerId`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExchangeRate` (
    `id` VARCHAR(191) NOT NULL,
    `baseCurrency` VARCHAR(3) NOT NULL,
    `quoteCurrency` VARCHAR(3) NOT NULL,
    `rate` DECIMAL(38, 18) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,

    INDEX `ExchangeRate_baseCurrency_quoteCurrency_timestamp_idx`(`baseCurrency`, `quoteCurrency`, `timestamp`),
    UNIQUE INDEX `ExchangeRate_baseCurrency_quoteCurrency_timestamp_key`(`baseCurrency`, `quoteCurrency`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(38, 18) NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `type` ENUM('INCOME', 'EXPENSE', 'TRANSFER') NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransactionCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NetWorthAsset` ADD CONSTRAINT `NetWorthAsset_tickerId_fkey` FOREIGN KEY (`tickerId`) REFERENCES `StockTicker`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NetWorthAssetQuantity` ADD CONSTRAINT `NetWorthAssetQuantity_netWorthAssetId_fkey` FOREIGN KEY (`netWorthAssetId`) REFERENCES `NetWorthAsset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NetWorthDebtQuantity` ADD CONSTRAINT `NetWorthDebtQuantity_netWorthDebtId_fkey` FOREIGN KEY (`netWorthDebtId`) REFERENCES `NetWorthDebt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockPriceHistory` ADD CONSTRAINT `StockPriceHistory_tickerId_fkey` FOREIGN KEY (`tickerId`) REFERENCES `StockTicker`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `TransactionCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
