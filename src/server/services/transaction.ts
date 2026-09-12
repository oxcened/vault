import type { PrismaClient } from "@prisma/client";
import { TransactionType } from "@prisma/client";
import { APP_CURRENCY } from "~/constants";
import { appEmitter } from "~/server/eventBus";
import type { CreateTransaction } from "~/trpc/schemas/transaction";

type TransactionDb = PrismaClient;

export async function createTransaction({
  db,
  input,
  userId,
}: {
  db: TransactionDb;
  input: CreateTransaction;
  userId: string;
}) {
  const category = await db.transactionCategory.findUnique({
    where: { id: input.categoryId },
    select: { type: true },
  });

  if (!category) {
    throw new Error("Category not found.");
  }

  if (category.type !== input.type) {
    throw new Error(
      `Cannot assign a ${category.type.toLowerCase()} category to a ${input.type.toLowerCase()} transaction.`,
    );
  }

  const result = await db.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        timestamp: input.timestamp,
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        type: input.type,
        status: input.status,
        category: { connect: { id: input.categoryId } },
        createdBy: { connect: { id: userId } },
      },
    });

    if (input.currency.toUpperCase() !== APP_CURRENCY) {
      const date = new Date(input.timestamp);
      date.setUTCHours(0, 0, 0, 0);

      await tx.exchangeRate.upsert({
        where: {
          base_quote_timestamp: {
            baseCurrency: input.currency.toUpperCase(),
            quoteCurrency: APP_CURRENCY,
            timestamp: date,
          },
        },
        update: {},
        create: {
          baseCurrency: input.currency.toUpperCase(),
          quoteCurrency: APP_CURRENCY,
          rate: 1,
          timestamp: date,
        },
      });
    }

    return created;
  });

  appEmitter.emit("transaction:updated", {
    userId,
    timestamp: result.timestamp,
  });

  return result;
}

export const shortcutExpenseDefaults = {
  type: TransactionType.EXPENSE,
  status: "POSTED" as const,
};
