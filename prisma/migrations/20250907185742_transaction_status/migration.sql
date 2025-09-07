-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('POSTED', 'PLANNED');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'POSTED';
