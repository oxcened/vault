import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { APP_CURRENCY } from "~/constants";
import { type ExchangeRate } from "@prisma/client";
import { createNetWorthDebtSchema } from "~/trpc/schemas/netWorthDebt";
import { evaluate } from "mathjs";
import { appEmitter } from "~/server/eventBus";
import * as yup from "yup";
import {
  getDebtValueHistory,
  getDebtValuesForUserMonth,
} from "~/server/utils/db";

export const netWorthDebtRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createNetWorthDebtSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.$transaction(async (tx) => {
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);

        // Create the debt record
        const debtRecord = await tx.netWorthDebt.create({
          data: {
            name: input.name,
            currency: input.currency,
            category: { connect: { id: input.categoryId } },
            createdBy: { connect: { id: ctx.session.user.id } },
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const quantity: number = evaluate(input.initialQuantity);

        // Create the initial quantity record.
        const quantityRecord = await tx.netWorthDebtQuantity.create({
          data: {
            netWorthDebtId: debtRecord.id,
            quantity,
            timestamp: date,
            quantityFormula: input.initialQuantity,
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

        return {
          asset: debtRecord,
          quantity: quantityRecord,
          exchangeRate: exchangeRateRecord,
        };
      });

      appEmitter.emit("netWorthDebtQuantity:updated", {
        userId: ctx.session.user.id,
        timestamp: result.quantity.timestamp,
      });

      return result;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.netWorthDebt.delete({
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

      const firstQuantity = deleted.quantities[0];

      if (firstQuantity) {
        appEmitter.emit("netWorthDebtQuantity:updated", {
          userId: ctx.session.user.id,
          timestamp: firstQuantity.timestamp,
        });
      }

      return deleted;
    }),
  getAll: protectedProcedure
    .input(
      yup.object({
        date: yup.date().required(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getDebtValuesForUserMonth({
        db: ctx.db,
        startDate: input.date,
        userId: ctx.session.user.id,
      });
    }),
  getDetailById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const asset = await tx.netWorthDebt.findFirst({
          where: { id: input.id },
          include: {
            quantities: {
              orderBy: {
                timestamp: "desc",
              },
            },
            category: true,
          },
        });

        const latestQuantity = asset?.quantities[0];
        const nativeComputedValue = latestQuantity?.quantity;
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

        const valueHistory = await getDebtValueHistory({
          db: tx,
          userId: ctx.session.user.id,
          debtId: input.id,
        });

        return {
          ...asset,
          latestQuantity,
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
        currency: yup.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, categoryId, ...data } = input;
      const updatedAsset = await ctx.db.netWorthDebt.update({
        where: { id: input.id },
        data: {
          ...data,
          category: categoryId ? { connect: { id: categoryId } } : undefined,
        },
      });

      return updatedAsset;
    }),
  upsertQuantity: protectedProcedure
    .input(
      yup.object({
        debtId: yup.string().required().label("Debt ID"),
        timestamp: yup.date().label("Date").required(),
        quantity: yup.string().label("Quantity").required(),
        quantityFormula: yup.string().label("Quantity formula"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { debtId, ...data } = input;
      const updateQuantity = await ctx.db.netWorthDebtQuantity.upsert({
        where: {
          netWorthDebtId_timestamp: {
            netWorthDebtId: input.debtId,
            timestamp: input.timestamp,
          },
        },
        create: {
          ...data,
          netWorthDebt: { connect: { id: debtId } },
        },
        update: data,
      });

      appEmitter.emit("netWorthDebtQuantity:updated", {
        userId: ctx.session.user.id,
        timestamp: input.timestamp,
      });

      return updateQuantity;
    }),
  deleteQuantityByTimestamp: protectedProcedure
    .input(
      yup.object({
        debtId: yup.string().required().label("Debt ID"),
        timestamp: yup.date().label("Date").required(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const deletedQuantity = await ctx.db.netWorthDebtQuantity.delete({
        where: {
          netWorthDebtId_timestamp: {
            netWorthDebtId: input.debtId,
            timestamp: input.timestamp,
          },
        },
      });

      appEmitter.emit("netWorthDebtQuantity:updated", {
        userId: ctx.session.user.id,
        timestamp: input.timestamp,
      });

      return deletedQuantity;
    }),
  getQuantitiesByDebtId: protectedProcedure
    .input(
      yup.object({
        debtId: yup.string().required(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.db.netWorthDebtQuantity.findMany({
        where: {
          netWorthDebtId: input.debtId,
        },
        orderBy: {
          timestamp: "desc",
        },
      });
    }),
});
