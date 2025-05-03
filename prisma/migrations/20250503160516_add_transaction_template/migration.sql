-- CreateTable
CREATE TABLE "TransactionTemplate" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "currency" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "TransactionTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TransactionTemplate" ADD CONSTRAINT "TransactionTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTemplate" ADD CONSTRAINT "TransactionTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TransactionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
