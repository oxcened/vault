import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { APP_CURRENCY } from "~/constants";
import { type ExchangeRate, type StockPriceHistory } from "@prisma/client";
import { createNetWorthAssetSchema } from "~/trpc/schemas/netWorthAsset";
import { sanitizeOptionalString } from "~/server/utils/sanitize";
import { evaluate } from "mathjs";
import { appEmitter } from "~/server/eventBus";
import {
  getAssetValueHistory,
  getAssetValuesForUserMonth,
} from "~/server/utils/db";
import * as yup from "yup";

export const netWorthAssetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createNetWorthAssetSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.$transaction(async (tx) => {
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

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const quantity: number = evaluate(input.initialQuantity);

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

        return {
          asset: assetRecord,
          quantity: quantityRecord,
          price: priceRecord,
          exchangeRate: exchangeRateRecord,
        };
      });

      appEmitter.emit("netWorthAssetQuantity:updated", {
        userId: ctx.session.user.id,
        timestamp: result.quantity.timestamp,
      });

      return result;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deletedAsset = await ctx.db.netWorthAsset.delete({
        where: { id: input.id },
        select: {
          quantities: {
            orderBy: { timestamp: "asc" },
            take: 1,
          },
        },
      });

      const firstQuantity = deletedAsset.quantities[0];

      if (firstQuantity) {
        appEmitter.emit("netWorthAssetQuantity:updated", {
          userId: ctx.session.user.id,
          timestamp: firstQuantity.timestamp,
        });
      }

      return deletedAsset;
    }),
  getAll: protectedProcedure
    .input(
      yup.object({
        date: yup.date().required(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getAssetValuesForUserMonth({
        db: ctx.db,
        startDate: input.date,
        userId: ctx.session.user.id,
      });
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
            category: true,
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

        const valueHistory = await getAssetValueHistory({
          db: tx,
          userId: ctx.session.user.id,
          assetId: input.id,
        });

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
  update: protectedProcedure
    .input(
      yup.object({
        id: yup.string().required(),
        name: yup.string(),
        categoryId: yup.string(),
        archivedAt: yup.date(),
        tickerId: yup.string(),
        currency: yup.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, categoryId, tickerId, ...data } = input;
      const updatedAsset = await ctx.db.netWorthAsset.update({
        where: { id: input.id },
        data: {
          ...data,
          ticker: tickerId ? { connect: { id: tickerId } } : undefined,
          category: categoryId ? { connect: { id: categoryId } } : undefined,
        },
      });

      return updatedAsset;
    }),
  upsertQuantity: protectedProcedure
    .input(
      yup.object({
        assetId: yup.string().required().label("Asset ID"),
        timestamp: yup.date().label("Date").required(),
        quantity: yup.string().label("Quantity").required(),
        quantityFormula: yup.string().label("Quantity formula"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { assetId, ...data } = input;
      const updateQuantity = await ctx.db.netWorthAssetQuantity.upsert({
        where: {
          netWorthAssetId_timestamp: {
            netWorthAssetId: input.assetId,
            timestamp: input.timestamp,
          },
        },
        create: {
          ...data,
          netWorthAsset: { connect: { id: assetId } },
        },
        update: data,
      });

      appEmitter.emit("netWorthAssetQuantity:updated", {
        userId: ctx.session.user.id,
        timestamp: input.timestamp,
      });

      return updateQuantity;
    }),
});
