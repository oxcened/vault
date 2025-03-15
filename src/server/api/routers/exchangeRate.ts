import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { earliestDateOptional } from "~/server/utils/date";
import {
  createExchangeRateSchema,
  updateExchangeRateSchema,
} from "~/trpc/schemas/exchangeRate";
import { updateNetWorthFromDate } from "~/server/utils/db";

export const exchangeRateRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.exchangeRate.findMany({
      orderBy: { timestamp: "desc" },
    });
  }),

  create: protectedProcedure
    .input(createExchangeRateSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.exchangeRate.create({
        data: {
          baseCurrency: input.baseCurrency.toUpperCase(),
          quoteCurrency: input.quoteCurrency.toUpperCase(),
          rate: input.rate,
          timestamp: input.timestamp,
        },
      });
    }),
  update: protectedProcedure
    .input(updateExchangeRateSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const updated = await tx.exchangeRate.update({
          where: { id: input.id },
          data: {
            baseCurrency: input.baseCurrency,
            quoteCurrency: input.quoteCurrency,
            rate: input.rate,
            timestamp: input.timestamp,
          },
        });

        const [earliestAsset, earliestDebt] = await Promise.all([
          tx.netWorthAssetQuantity.findFirst({
            where: {
              netWorthAsset: {
                currency: updated.baseCurrency,
              },
            },
            orderBy: {
              timestamp: "asc",
            },
          }),
          tx.netWorthDebtQuantity.findFirst({
            where: {
              netWorthDebt: {
                currency: updated.baseCurrency,
              },
            },
            orderBy: {
              timestamp: "asc",
            },
          }),
        ]);

        const earliest = earliestDateOptional(
          earliestAsset?.timestamp,
          earliestDebt?.timestamp,
        );

        if (earliest) {
          await updateNetWorthFromDate({
            db: tx,
            date: earliest,
            createdBy: ctx.session.user.id,
          });
        }

        return updated;
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.exchangeRate.delete({
        where: { id: input.id },
      });
    }),
});
