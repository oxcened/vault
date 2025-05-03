import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "~/trpc/schemas/transaction";
import { APP_CURRENCY } from "~/constants";
import { appEmitter } from "~/server/eventBus";
import * as yup from "yup";

export const transactionRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      yup.object({
        limit: yup.number().min(1).max(100).default(20),
        cursor: yup.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.transaction.findMany({
        where: {
          createdById: ctx.session.user.id,
        },
        orderBy: { timestamp: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
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

      let nextCursor: string | null = null;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id ?? null;
      }

      return {
        items,
        nextCursor,
      };
    }),

  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.$transaction(async (tx) => {
        const created = await tx.transaction.create({
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

        return created;
      });

      appEmitter.emit("transaction:updated", {
        userId: ctx.session.user.id,
        timestamp: result.timestamp,
      });

      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.transaction.delete({
        where: { id: input.id },
      });

      appEmitter.emit("transaction:updated", {
        userId: ctx.session.user.id,
        timestamp: deleted.timestamp,
      });

      return deleted;
    }),

  update: protectedProcedure
    .input(updateTransactionSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.transaction.update({
        where: { id: input.id },
        data: input,
      });

      appEmitter.emit("transaction:updated", {
        userId: ctx.session.user.id,
        timestamp: updated.timestamp,
      });

      return updated;
    }),
});
