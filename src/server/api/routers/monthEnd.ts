import { z } from "zod";
import { subMonths } from "date-fns";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { appEmitter } from "~/server/eventBus";
import {
  toMonthTimestamp,
  toMonthTimestampEnd,
  toNextMonthTimestamp,
} from "~/utils/date";

const monthInput = z.object({ month: z.date() });

export const monthEndRouter = createTRPCRouter({
  get: protectedProcedure.input(monthInput).query(async ({ ctx, input }) => {
    const monthStart = toMonthTimestamp(input.month);
    const nextMonth = toNextMonthTimestamp(monthStart);
    const previousMonthStart = toMonthTimestamp(subMonths(monthStart, 1));

    const [
      previousStockPrices,
      currentStockPrices,
      previousRates,
      currentRates,
    ] = await Promise.all([
      ctx.db.stockPriceHistory.findMany({
        where: {
          timestamp: { gte: previousMonthStart, lt: monthStart },
        },
        include: { ticker: true },
        orderBy: [{ ticker: { name: "asc" } }, { timestamp: "desc" }],
      }),
      ctx.db.stockPriceHistory.findMany({
        where: { timestamp: { gte: monthStart, lt: nextMonth } },
        include: { ticker: true },
      }),
      ctx.db.exchangeRate.findMany({
        where: {
          timestamp: { gte: previousMonthStart, lt: monthStart },
        },
        orderBy: [
          { baseCurrency: "asc" },
          { quoteCurrency: "asc" },
          { timestamp: "desc" },
        ],
      }),
      ctx.db.exchangeRate.findMany({
        where: { timestamp: { gte: monthStart, lt: nextMonth } },
      }),
    ]);

    const currentStockByTicker = new Map<
      string,
      (typeof currentStockPrices)[number]
    >();
    currentStockPrices
      .toSorted((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .forEach((price) => {
        if (!currentStockByTicker.has(price.tickerId)) {
          currentStockByTicker.set(price.tickerId, price);
        }
      });
    const currentRateByPair = new Map<string, (typeof currentRates)[number]>();
    currentRates
      .toSorted((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .forEach((rate) => {
        const key = `${rate.baseCurrency}:${rate.quoteCurrency}`;
        if (!currentRateByPair.has(key)) currentRateByPair.set(key, rate);
      });

    const previousStockByTicker = new Map<
      string,
      (typeof previousStockPrices)[number]
    >();
    previousStockPrices.forEach((price) => {
      if (!previousStockByTicker.has(price.tickerId)) {
        previousStockByTicker.set(price.tickerId, price);
      }
    });
    const previousRateByPair = new Map<
      string,
      (typeof previousRates)[number]
    >();
    previousRates.forEach((rate) => {
      const key = `${rate.baseCurrency}:${rate.quoteCurrency}`;
      if (!previousRateByPair.has(key)) previousRateByPair.set(key, rate);
    });

    const activeTickerIds = new Set([
      ...previousStockByTicker.keys(),
      ...currentStockByTicker.keys(),
    ]);
    const activePairKeys = new Set([
      ...previousRateByPair.keys(),
      ...currentRateByPair.keys(),
    ]);

    return {
      month: monthStart,
      stockPrices: [...activeTickerIds]
        .map((tickerId) => {
          const previous = previousStockByTicker.get(tickerId);
          const current = currentStockByTicker.get(tickerId);
          const source = current ?? previous!;
          return {
            tickerId,
            ticker: source.ticker.ticker,
            name: source.ticker.name,
            exchange: source.ticker.exchange,
            previousValue: previous?.price,
            currentValue: current?.price,
            isClosing: current?.isClosing ?? false,
            confirmedAt: current?.confirmedAt,
          };
        })
        .toSorted((a, b) => a.name.localeCompare(b.name)),
      exchangeRates: [...activePairKeys].map((key) => {
        const previous = previousRateByPair.get(key);
        const current = currentRateByPair.get(key);
        const source = current ?? previous!;
        return {
          baseCurrency: source.baseCurrency,
          quoteCurrency: source.quoteCurrency,
          previousValue: previous?.rate,
          currentValue: current?.rate,
          isClosing: current?.isClosing ?? false,
          confirmedAt: current?.confirmedAt,
        };
      }),
    };
  }),

  save: protectedProcedure
    .input(
      monthInput.extend({
        stockPrices: z.array(
          z.object({ tickerId: z.string(), value: z.number().positive() }),
        ),
        exchangeRates: z.array(
          z.object({
            baseCurrency: z.string().length(3),
            quoteCurrency: z.string().length(3),
            value: z.number().positive(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const monthStart = toMonthTimestamp(input.month);
      const nextMonth = toNextMonthTimestamp(monthStart);
      const timestamp = toMonthTimestampEnd(monthStart);

      const updatedIds = await ctx.db.$transaction(async (db) => {
        const stockPriceIds: string[] = [];
        const exchangeRateIds: string[] = [];

        for (const item of input.stockPrices) {
          const existing = await db.stockPriceHistory.findFirst({
            where: {
              tickerId: item.tickerId,
              timestamp: { gte: monthStart, lt: nextMonth },
            },
            orderBy: { timestamp: "desc" },
          });
          if (existing) {
            const updated = await db.stockPriceHistory.update({
              where: { id: existing.id },
              data: {
                price: item.value,
                isClosing: true,
                confirmedAt: new Date(),
              },
            });
            stockPriceIds.push(updated.id);
          } else {
            const created = await db.stockPriceHistory.create({
              data: {
                tickerId: item.tickerId,
                price: item.value,
                timestamp,
                isClosing: true,
                confirmedAt: new Date(),
              },
            });
            stockPriceIds.push(created.id);
          }
        }

        for (const item of input.exchangeRates) {
          const baseCurrency = item.baseCurrency.toUpperCase();
          const quoteCurrency = item.quoteCurrency.toUpperCase();
          const existing = await db.exchangeRate.findFirst({
            where: {
              baseCurrency,
              quoteCurrency,
              timestamp: { gte: monthStart, lt: nextMonth },
            },
            orderBy: { timestamp: "desc" },
          });
          if (existing) {
            const updated = await db.exchangeRate.update({
              where: { id: existing.id },
              data: {
                rate: item.value,
                isClosing: true,
                confirmedAt: new Date(),
              },
            });
            exchangeRateIds.push(updated.id);
          } else {
            const created = await db.exchangeRate.create({
              data: {
                baseCurrency,
                quoteCurrency,
                rate: item.value,
                timestamp,
                isClosing: true,
                confirmedAt: new Date(),
              },
            });
            exchangeRateIds.push(created.id);
          }
        }

        return { stockPriceIds, exchangeRateIds };
      });

      updatedIds.stockPriceIds.forEach((stockPriceId) =>
        appEmitter.emit("stockPrice:updated", { stockPriceId }),
      );
      updatedIds.exchangeRateIds.forEach((exchangeRateId) =>
        appEmitter.emit("exchangeRate:updated", { exchangeRateId }),
      );
      return { updated: input.stockPrices.length + input.exchangeRates.length };
    }),
});
