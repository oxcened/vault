import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
  createStockPriceSchema,
  updateStockPriceSchema,
} from "~/trpc/schemas/stockPrice";
import { appEmitter } from "~/server/eventBus";
import { TRPCError } from "@trpc/server";
import { toMonthTimestampEnd, toNextMonthTimestamp } from "~/utils/date";

export const stockPriceRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        tickerId: z.string(),
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(100).default(25),
      }),
    )
    .query(async ({ input, ctx }) => {
      const where = { tickerId: input.tickerId };
      const items = await ctx.db.stockPriceHistory.findMany({
        where,
        orderBy: [{ timestamp: "desc" }, { id: "desc" }],
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : 0,
        take: input.limit + 1,
        include: {
          ticker: true,
        },
      });
      const hasMore = items.length > input.limit;
      if (hasMore) items.pop();

      return {
        items,
        nextCursor: hasMore ? items.at(-1)?.id : undefined,
        totalCount: await ctx.db.stockPriceHistory.count({ where }),
      };
    }),

  create: protectedProcedure
    .input(createStockPriceSchema)
    .mutation(async ({ input, ctx }) => {
      const timestamp = toMonthTimestampEnd(input.timestamp);
      const existing = await ctx.db.stockPriceHistory.findFirst({
        where: {
          tickerId: input.tickerId,
          timestamp: { gte: timestamp, lt: toNextMonthTimestamp(timestamp) },
        },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "A stock price already exists for this month. Edit the existing price instead.",
        });
      }
      return ctx.db.stockPriceHistory.create({
        data: {
          tickerId: input.tickerId,
          price: input.price,
          timestamp,
          isClosing: false,
          confirmedAt: null,
        },
      });
    }),

  update: protectedProcedure
    .input(updateStockPriceSchema)
    .mutation(async ({ input, ctx }) => {
      const timestamp = toMonthTimestampEnd(input.timestamp);
      const existing = await ctx.db.stockPriceHistory.findFirst({
        where: {
          tickerId: input.tickerId,
          id: { not: input.id },
          timestamp: { gte: timestamp, lt: toNextMonthTimestamp(timestamp) },
        },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A stock price already exists for this month.",
        });
      }
      const updated = await ctx.db.stockPriceHistory.update({
        where: { id: input.id },
        data: {
          price: input.price,
          timestamp,
          isClosing: false,
          confirmedAt: null,
        },
      });

      appEmitter.emit("stockPrice:updated", { stockPriceId: updated.id });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.stockPriceHistory.delete({
        where: { id: input.id },
      });

      appEmitter.emit("stockPrice:updated", { stockPriceId: deleted.id });

      return deleted;
    }),
});
