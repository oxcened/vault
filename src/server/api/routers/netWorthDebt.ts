import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getNetWorthDebtHistory, getNetWorthDebts } from "@prisma/client/sql";
import { APP_CURRENCY } from "~/constants";
import { updateFromDate } from "./netWorth";
import { ExchangeRate } from "@prisma/client";
import { createNetWorthDebtSchema } from "~/trpc/schemas/netWorthDebt";
import { sanitizeOptionalString } from "~/server/utils/sanitize";

export const netWorthDebtRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createNetWorthDebtSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);

        const category =
          sanitizeOptionalString(input.customCategory) ?? input.category;

        // Create the debt record
        const debtRecord = await tx.netWorthDebt.create({
          data: {
            name: input.name,
            category,
            currency: input.currency,
          },
        });

        // Create the initial quantity record.
        const quantityRecord = await tx.netWorthDebtQuantity.create({
          data: {
            netWorthDebtId: debtRecord.id,
            quantity: input.initialQuantity,
            timestamp: date,
            quantityFormula: input.quantityFormula,
          },
        });

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
          asset: debtRecord,
          quantity: quantityRecord,
          exchangeRate: exchangeRateRecord,
        };
      });
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const deleted = await tx.netWorthDebt.delete({
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

        const startDate = deleted.quantities[0]?.timestamp;

        if (startDate) {
          startDate?.setUTCHours(0, 0, 0, 0);

          await updateFromDate({
            db: tx,
            date: startDate,
          });
        }

        return deleted;
      });
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.$queryRawTyped(getNetWorthDebts(APP_CURRENCY, APP_CURRENCY));
  }),
  getDetailById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const asset = await ctx.db.netWorthDebt.findFirst({
        where: { id: input.id },
        include: {
          quantities: {
            orderBy: {
              timestamp: "desc",
            },
          },
        },
      });

      const latestQuantity = asset?.quantities[0];
      const nativeComputedValue = latestQuantity?.quantity;
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
        getNetWorthDebtHistory(input.id, APP_CURRENCY, APP_CURRENCY),
      );

      return {
        ...asset,
        latestQuantity,
        valueHistory,
        nativeComputedValue,
        computedValue,
      };
    }),
});
