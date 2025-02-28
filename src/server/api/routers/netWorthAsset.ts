import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getNetWorthAssetHistory, getNetWorthAssets } from "@prisma/client/sql";
import { APP_CURRENCY, STOCK_TYPE } from "~/constants";
import { updateFromDate } from "./netWorth";
import { ExchangeRate, StockPriceHistory, StockTicker } from "@prisma/client";

export const netWorthAssetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().nonempty(),
        type: z.string().nonempty(), // e.g., "stock" or another asset type
        customType: z.string().optional(),
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

        const type = input.customType || input.type;

        let tickerRecord: StockTicker | null = null;

        if (type === STOCK_TYPE) {
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
            type,
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
        if (type === STOCK_TYPE) {
          const stockPrice = 0;
          priceRecord = await tx.stockPriceHistory.upsert({
            where: {
              ticker_timestamp: {
                tickerId: tickerRecord!.id,
                timestamp: date,
              },
            },
            update: {},
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
          const newRate = 1;

          exchangeRateRecord = await tx.exchangeRate.upsert({
            where: {
              base_quote_timestamp: {
                baseCurrency: input.currency.toUpperCase(),
                quoteCurrency: APP_CURRENCY,
                timestamp: date,
              },
            },
            update: {},
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
