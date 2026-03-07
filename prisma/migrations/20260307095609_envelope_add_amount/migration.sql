/*
  Warnings:

  - Added the required column `amount` to the `Envelope` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Envelope" ADD COLUMN     "amount" DECIMAL(38,18) NOT NULL;
