import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
  createExchangeRateSchema,
  updateExchangeRateSchema,
} from "~/trpc/schemas/exchangeRate";
import { recomputeDerivedDataForDependency } from "~/server/utils/db";

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

        await recomputeDerivedDataForDependency({
          db: tx,
          dependencyType: "ExchangeRate",
          dependencyKey: updated.id,
        });

        return updated;
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const deleted = await tx.exchangeRate.delete({
          where: { id: input.id },
        });

        await recomputeDerivedDataForDependency({
          db: tx,
          dependencyType: "ExchangeRate",
          dependencyKey: deleted.id,
        });

        return deleted;
      });
    }),
});
