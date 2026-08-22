/*
  Warnings:

  - You are about to drop the column `autoUpdate` on the `StockTicker` table. All the data in the column will be lost.
  - You are about to drop the column `providerSymbol` on the `StockTicker` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Envelope" ALTER COLUMN "amount" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StockTicker" DROP COLUMN "autoUpdate",
DROP COLUMN "providerSymbol";
