import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
  createExchangeRateSchema,
  updateExchangeRateSchema,
} from "~/trpc/schemas/exchangeRate";
import { appEmitter } from "~/server/eventBus";

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
      const updated = await ctx.db.exchangeRate.update({
        where: { id: input.id },
        data: {
          baseCurrency: input.baseCurrency,
          quoteCurrency: input.quoteCurrency,
          rate: input.rate,
          timestamp: input.timestamp,
        },
      });

      appEmitter.emit("exchangeRate:updated", { exchangeRateId: updated.id });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.exchangeRate.delete({
        where: { id: input.id },
      });

      appEmitter.emit("exchangeRate:updated", { exchangeRateId: deleted.id });

      return deleted;
    }),
});
