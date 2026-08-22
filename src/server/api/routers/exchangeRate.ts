import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
  createExchangeRateSchema,
  updateExchangeRateSchema,
} from "~/trpc/schemas/exchangeRate";
import { appEmitter } from "~/server/eventBus";
import { TRPCError } from "@trpc/server";
import {
  toMonthTimestampEnd,
  toNextMonthTimestamp,
} from "~/utils/date";

export const exchangeRateRouter = createTRPCRouter({
  getPairs: protectedProcedure.query(({ ctx }) =>
    ctx.db.exchangeRate.findMany({
      distinct: ["baseCurrency", "quoteCurrency"],
      orderBy: [{ baseCurrency: "asc" }, { quoteCurrency: "asc" }],
      select: { baseCurrency: true, quoteCurrency: true },
    }),
  ),
  getAll: protectedProcedure
    .input(
      z.object({
        baseCurrency: z.string(),
        quoteCurrency: z.string(),
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(100).default(25),
      }),
    )
    .query(async ({ input, ctx }) => {
      const where = {
        baseCurrency: input.baseCurrency,
        quoteCurrency: input.quoteCurrency,
      };
      const items = await ctx.db.exchangeRate.findMany({
        where,
        orderBy: [{ timestamp: "desc" }, { id: "desc" }],
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : 0,
        take: input.limit + 1,
      });
      const hasMore = items.length > input.limit;
      if (hasMore) items.pop();

      return {
        items,
        nextCursor: hasMore ? items.at(-1)?.id : undefined,
        totalCount: await ctx.db.exchangeRate.count({ where }),
      };
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
          isClosing: false,
          confirmedAt: null,
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
          isClosing: false,
          confirmedAt: null,
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
