/*
  Warnings:

  - You are about to drop the column `type` on the `NetWorthAsset` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `NetWorthDebt` table. All the data in the column will be lost.
  - Added the required column `category` to the `NetWorthAsset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `NetWorthDebt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `NetWorthAsset` DROP COLUMN `type`,
    ADD COLUMN `category` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `NetWorthDebt` DROP COLUMN `type`,
    ADD COLUMN `category` VARCHAR(191) NOT NULL;

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
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `TransactionCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
