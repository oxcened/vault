import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { updateFromDate } from "./netWorth";
import { earliestDateOptional } from "~/server/utils/date";

export const exchangeRateRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.exchangeRate.findMany({
      orderBy: { timestamp: "desc" },
    });
  }),

  // Example: Create a new exchange rate record.
  create: protectedProcedure
    .input(
      z.object({
        baseCurrency: z.string().length(3),
        quoteCurrency: z.string().length(3),
        rate: z.number(),
        timestamp: z.date(),
      }),
    )
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
    .input(
      z.object({
        id: z.string(),
        baseCurrency: z.string().length(3).toUpperCase(),
        quoteCurrency: z.string().length(3).toUpperCase(),
        rate: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const updated = await tx.exchangeRate.update({
          where: { id: input.id },
          data: {
            baseCurrency: input.baseCurrency,
            quoteCurrency: input.quoteCurrency,
            rate: input.rate,
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
          await updateFromDate({
            db: tx,
            date: earliest,
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
