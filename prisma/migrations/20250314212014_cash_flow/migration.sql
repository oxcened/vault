-- CreateTable
CREATE TABLE `CashFlow` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `income` DECIMAL(38, 18) NOT NULL,
    `expenses` DECIMAL(38, 18) NOT NULL,
    `netFlow` DECIMAL(38, 18) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CashFlow_timestamp_idx`(`timestamp`),
    UNIQUE INDEX `CashFlow_timestamp_key`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CashFlow` ADD CONSTRAINT `CashFlow_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
