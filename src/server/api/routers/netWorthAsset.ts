import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getNetWorthAssetHistory, getNetWorthAssets } from "@prisma/client/sql";
import { APP_CURRENCY } from "~/constants";
import { type ExchangeRate, type StockPriceHistory } from "@prisma/client";
import { createNetWorthAssetSchema } from "~/trpc/schemas/netWorthAsset";
import { sanitizeOptionalString } from "~/server/utils/sanitize";
import { updateNetWorthFromDate } from "~/server/utils/db";
import { evaluate } from "mathjs";

export const netWorthAssetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createNetWorthAssetSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);

        const tickerId = sanitizeOptionalString(input.tickerId);

        // Create the asset record; assign tickerId if a tickerRecord exists.
        const assetRecord = await tx.netWorthAsset.create({
          data: {
            name: input.name,
            currency: input.currency,
            category: { connect: { id: input.categoryId } },
            ticker: tickerId ? { connect: { id: tickerId } } : undefined,
            createdBy: { connect: { id: ctx.session.user.id } },
          },
        });

        const quantity = evaluate(input.initialQuantity);

        // Create the initial quantity record.
        const quantityRecord = await tx.netWorthAssetQuantity.create({
          data: {
            netWorthAssetId: assetRecord.id,
            quantity,
            timestamp: date,
            quantityFormula: input.initialQuantity,
          },
        });

        // For stock assets, create a stock price history record.
        let priceRecord: StockPriceHistory | null = null;
        if (tickerId) {
          const stockPrice = 0;
          priceRecord = await tx.stockPriceHistory.upsert({
            where: {
              ticker_timestamp: {
                tickerId,
                timestamp: date,
              },
            },
            update: {},
            create: {
              tickerId,
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

        // Update net worth
        await updateNetWorthFromDate({
          db: tx,
          date,
          createdBy: ctx.session.user.id,
        });

        return {
          asset: assetRecord,
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

          await updateNetWorthFromDate({
            db: tx,
            date: startDate,
            createdBy: ctx.session.user.id,
          });
        }

        return deletedAsset;
      });
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.$queryRawTyped(
      getNetWorthAssets(APP_CURRENCY, APP_CURRENCY, ctx.session.user.id),
    );
  }),
  getDetailById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const asset = await tx.netWorthAsset.findFirst({
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
        const exchangeRate = await tx.exchangeRate.findFirst({
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

        const valueHistory = await tx.$queryRawTyped(
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
      });
    }),
});
