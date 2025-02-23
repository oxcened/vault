import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  aggregateNetWorthAssets,
  getNetWorthAssetHistory,
  getNetWorthAssets,
} from "@prisma/client/sql";
import { APP_CURRENCY } from "~/constants";
import { updateFromDate } from "./netWorth";
import {
  ExchangeRate,
  PrismaClient,
  StockPriceHistory,
  StockTicker,
} from "@prisma/client";

function getMockStockPrice(ticker: string): number {
  // Returns a mock stock price between 100 and 150
  return parseFloat((100 + Math.random() * 50).toFixed(2));
}

function getMockExchangeRate(base: string, quote: string): number {
  // Returns a mock exchange rate between 1 and 1.5
  return parseFloat((1 + Math.random() * 0.5).toFixed(4));
}

export function aggregateAll(db: Pick<PrismaClient, "$queryRawTyped">) {
  return db.$queryRawTyped(aggregateNetWorthAssets(APP_CURRENCY, APP_CURRENCY));
}

export const netWorthAssetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().nonempty(),
        type: z.string().nonempty(), // e.g., "stock" or another asset type
        currency: z.string().nonempty(),
        initialQuantity: z.number().nonnegative(),
        quantityFormula: z.string().optional(),
        // These fields are required for stock assets.
        ticker: z.string().optional(),
        exchange: z.string().optional(),
        stockName: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);

        let tickerRecord: StockTicker | null = null;

        if (input.type.toLowerCase() === "stock") {
          if (!input.ticker || !input.exchange || !input.stockName) {
            throw new Error(
              'For stock assets, "ticker", "exchange", and "stockName" are required.',
            );
          }

          // Use upsert to either get or create the ticker record based on the composite unique key.
          tickerRecord = await tx.stockTicker.upsert({
            where: {
              ticker_exchange: {
                ticker: input.ticker,
                exchange: input.exchange,
              },
            },
            update: {},
            create: {
              ticker: input.ticker,
              exchange: input.exchange,
              name: input.stockName,
            },
          });
        }

        // Create the asset record; assign tickerId if a tickerRecord exists.
        const assetRecord = await tx.netWorthAsset.create({
          data: {
            name: input.name,
            type: input.type,
            currency: input.currency,
            tickerId: tickerRecord ? tickerRecord.id : null,
          },
        });

        // Create the initial quantity record.
        const quantityRecord = await tx.netWorthAssetQuantity.create({
          data: {
            netWorthAssetId: assetRecord.id,
            quantity: input.initialQuantity,
            timestamp: date,
            quantityFormula: input.quantityFormula,
          },
        });

        // For stock assets, create a stock price history record.
        let priceRecord: StockPriceHistory | null = null;
        if (input.type.toLowerCase() === "stock") {
          const stockPrice = getMockStockPrice(input.ticker!);
          priceRecord = await tx.stockPriceHistory.upsert({
            where: {
              ticker_timestamp: {
                tickerId: tickerRecord!.id,
                timestamp: date,
              },
            },
            update: {
              price: stockPrice,
            },
            create: {
              tickerId: tickerRecord!.id,
              price: stockPrice,
              timestamp: date,
            },
          });
        }

        // If the asset's currency isn't BASE_CURRENCY, update or create an exchange rate record.
        let exchangeRateRecord: ExchangeRate | null = null;
        if (input.currency.toUpperCase() !== APP_CURRENCY) {
          const newRate = getMockExchangeRate(
            APP_CURRENCY,
            input.currency.toUpperCase(),
          );

          exchangeRateRecord = await tx.exchangeRate.upsert({
            where: {
              base_quote_timestamp: {
                baseCurrency: input.currency.toUpperCase(),
                quoteCurrency: APP_CURRENCY,
                timestamp: date,
              },
            },
            update: { rate: newRate },
            create: {
              baseCurrency: input.currency.toUpperCase(),
              quoteCurrency: APP_CURRENCY,
              rate: newRate,
              timestamp: date,
            },
          });
        }

        await updateFromDate({
          db: tx,
          date,
        });

        return {
          asset: assetRecord,
          ticker: tickerRecord,
          quantity: quantityRecord,
          price: priceRecord,
          exchangeRate: exchangeRateRecord,
        };
      });
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const deletedAsset = await tx.netWorthAsset.delete({
          where: { id: input.id },
          include: {
            quantities: {
              orderBy: {
                timestamp: "asc",
              },
              take: 1,
            },
          },
        });

        const startDate = deletedAsset.quantities[0]?.timestamp;

        if (startDate) {
          startDate?.setUTCHours(0, 0, 0, 0);

          await updateFromDate({
            db: tx,
            date: startDate,
          });
        }

        return deletedAsset;
      });
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.$queryRawTyped(getNetWorthAssets(APP_CURRENCY, APP_CURRENCY));
  }),
  aggregateAll: protectedProcedure.query(async ({ ctx }) => {
    return aggregateAll(ctx.db);
  }),
  getDetailById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const asset = await ctx.db.netWorthAsset.findFirst({
        where: { id: input.id },
        include: {
          ticker: {
            include: {
              prices: {
                orderBy: {
                  timestamp: "desc",
                },
                take: 1,
              },
            },
          },
          quantities: {
            orderBy: {
              timestamp: "desc",
            },
          },
        },
      });

      const latestQuantity = asset?.quantities[0];
      const latestStockPrice = asset?.ticker?.prices[0];
      const nativeComputedValue = latestQuantity?.quantity?.times(
        latestStockPrice?.price ?? 1,
      );
      const exchangeRate = await ctx.db.exchangeRate.findFirst({
        where: {
          baseCurrency: asset?.currency,
          quoteCurrency: APP_CURRENCY,
        },
        orderBy: {
          timestamp: "desc",
        },
      });
      const computedValue = exchangeRate?.rate
        ? nativeComputedValue?.times(exchangeRate.rate)
        : nativeComputedValue;

      const valueHistory = await ctx.db.$queryRawTyped(
        getNetWorthAssetHistory(input.id, APP_CURRENCY, APP_CURRENCY),
      );

      return {
        ...asset,
        latestQuantity,
        latestStockPrice,
        valueHistory,
        nativeComputedValue,
        computedValue,
      };
    }),
});
