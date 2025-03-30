import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { recomputeCashFlowForUserFrom } from "~/server/utils/db";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "~/trpc/schemas/transaction";
import { APP_CURRENCY } from "~/constants";

export const transactionRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.transaction.findMany({
      where: {
        createdById: ctx.session.user.id,
      },
      orderBy: { timestamp: "desc" },
      // TODO introduce pagination
      take: 100,
      select: {
        id: true,
        amount: true,
        currency: true,
        timestamp: true,
        description: true,
        type: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });
  }),

  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            timestamp: input.timestamp,
            amount: input.amount,
            currency: input.currency,
            description: input.description,
            type: input.type,
            category: { connect: { id: input.categoryId } },
            createdBy: { connect: { id: ctx.session.user.id } },
          },
        });

        if (input.currency.toUpperCase() !== APP_CURRENCY) {
          const date = new Date(input.timestamp);
          date.setUTCHours(0, 0, 0, 0);
          const newRate = 1;

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
              rate: newRate,
              timestamp: date,
            },
          });
        }

        await recomputeCashFlowForUserFrom({
          db: tx,
          userId: ctx.session.user.id,
          startDate: input.timestamp,
        });

        return transaction;
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const transaction = await tx.transaction.delete({
          where: { id: input.id },
        });

        await recomputeCashFlowForUserFrom({
          db: tx,
          userId: ctx.session.user.id,
          startDate: transaction.timestamp,
        });

        return transaction;
      });
    }),

  update: protectedProcedure
    .input(updateTransactionSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const transaction = await tx.transaction.update({
          where: { id: input.id },
          data: input,
        });

        await recomputeCashFlowForUserFrom({
          db: tx,
          userId: ctx.session.user.id,
          startDate: transaction.timestamp,
        });

        return transaction;
      });
    }),
});
