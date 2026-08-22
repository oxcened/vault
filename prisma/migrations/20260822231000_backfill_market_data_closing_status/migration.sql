UPDATE "StockPriceHistory"
SET "isClosing" = true,
    "confirmedAt" = COALESCE("confirmedAt", CURRENT_TIMESTAMP)
WHERE "isClosing" = false;

UPDATE "ExchangeRate"
SET "isClosing" = true,
    "confirmedAt" = COALESCE("confirmedAt", CURRENT_TIMESTAMP)
WHERE "isClosing" = false;

ALTER TABLE "StockPriceHistory"
ALTER COLUMN "isClosing" SET DEFAULT true;

ALTER TABLE "ExchangeRate"
ALTER COLUMN "isClosing" SET DEFAULT true;
