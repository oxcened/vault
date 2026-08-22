import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
  createExchangeRateSchema,
  updateExchangeRateSchema,
} from "~/trpc/schemas/exchangeRate";
import { appEmitter } from "~/server/eventBus";
import { TRPCError } from "@trpc/server";
import { toMonthTimestamp, toMonthTimestampEnd, toNextMonthTimestamp } from "~/utils/date";

export const exchangeRateRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.exchangeRate.findMany({
      orderBy: { timestamp: "desc" },
    });
  }),

  create: protectedProcedure
    .input(createExchangeRateSchema)
    .mutation(async ({ input, ctx }) => {
      const baseCurrency = input.baseCurrency.toUpperCase();
      const quoteCurrency = input.quoteCurrency.toUpperCase();
      const timestamp = toMonthTimestampEnd(input.timestamp);
      const existing = await ctx.db.exchangeRate.findFirst({
        where: {
          baseCurrency,
          quoteCurrency,
          timestamp: { gte: timestamp, lt: toNextMonthTimestamp(timestamp) },
        },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "An exchange rate already exists for this currency pair and month. Edit it instead.",
        });
      }
      return ctx.db.exchangeRate.create({
        data: {
          baseCurrency,
          quoteCurrency,
          rate: input.rate,
          timestamp,
        },
      });
    }),
  update: protectedProcedure
    .input(updateExchangeRateSchema)
    .mutation(async ({ input, ctx }) => {
      const baseCurrency = input.baseCurrency.toUpperCase();
      const quoteCurrency = input.quoteCurrency.toUpperCase();
      const timestamp = toMonthTimestampEnd(input.timestamp);
      const existing = await ctx.db.exchangeRate.findFirst({
        where: {
          baseCurrency,
          quoteCurrency,
          id: { not: input.id },
          timestamp: { gte: timestamp, lt: toNextMonthTimestamp(timestamp) },
        },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "An exchange rate already exists for this currency pair and month.",
        });
      }
      const updated = await ctx.db.exchangeRate.update({
        where: { id: input.id },
        data: {
          baseCurrency,
          quoteCurrency,
          rate: input.rate,
          timestamp,
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
