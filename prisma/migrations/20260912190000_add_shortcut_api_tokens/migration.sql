-- CreateTable
CREATE TABLE "ShortcutApiToken" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ShortcutApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortcutApiToken_tokenHash_key" ON "ShortcutApiToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ShortcutApiToken_createdById_idx" ON "ShortcutApiToken"("createdById");

-- AddForeignKey
ALTER TABLE "ShortcutApiToken" ADD CONSTRAINT "ShortcutApiToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
