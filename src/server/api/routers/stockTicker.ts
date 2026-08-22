import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  createStockTickerSchema,
  updateStockTickerSchema,
} from "~/trpc/schemas/stockTicker";

export const stockTickerRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const tickers = await ctx.db.stockTicker.findMany({
      include: {
        prices: {
          orderBy: { timestamp: "desc" },
          take: 1,
          select: { timestamp: true },
        },
      },
    });

    return tickers
      .map(({ prices, ...ticker }) => ({
        ...ticker,
        latestPriceAt: prices[0]?.timestamp ?? null,
      }))
      .sort((a, b) => {
        if (a.latestPriceAt && b.latestPriceAt) {
          const dateDifference =
            b.latestPriceAt.getTime() - a.latestPriceAt.getTime();
          if (dateDifference !== 0) return dateDifference;
          return a.name.localeCompare(b.name);
        }
        if (a.latestPriceAt) return -1;
        if (b.latestPriceAt) return 1;
        return a.name.localeCompare(b.name);
      });
  }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.stockTicker.delete({
        where: { id: input.id },
      });

      return deleted;
    }),
  create: protectedProcedure
    .input(createStockTickerSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.stockTicker.create({
        data: input,
      });
    }),
  update: protectedProcedure
    .input(updateStockTickerSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.stockTicker.update({
        where: { id: input.id },
        data: input,
      });

      return updated;
    }),
});
