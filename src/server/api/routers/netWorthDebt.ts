import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { APP_CURRENCY } from "~/constants";
import { type ExchangeRate } from "@prisma/client";
import {
  createNetWorthDebtSchema,
  createQuantitySchema,
  updateQuantitySchema,
} from "~/trpc/schemas/netWorthDebt";
import { evaluate } from "mathjs";
import { appEmitter } from "~/server/eventBus";
import * as yup from "yup";
import {
  getDebtValueHistory,
  getDebtValuesForUserMonth,
} from "~/server/utils/db";
import { toMonthTimestamp, toNextMonthTimestamp } from "~/utils/date";

export const netWorthDebtRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createNetWorthDebtSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.$transaction(async (tx) => {
        const date = toMonthTimestamp(new Date());

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
  getValueHistory: protectedProcedure
    .input(
      z.object({
        debtId: z.string(),
        cursor: z.date().nullish(),
        limit: z.number().min(1).max(100).default(25),
      }),
    )
    .query(async ({ input, ctx }) => {
      const rows = await getDebtValueHistory({
        db: ctx.db,
        userId: ctx.session.user.id,
        debtId: input.debtId,
        cursor: input.cursor,
        limit: input.limit + 1,
      });
      const hasMore = rows.length > input.limit;
      const nextItem = hasMore ? rows[input.limit] : undefined;
      const items = hasMore ? rows.slice(0, input.limit) : rows;

      return {
        items,
        nextItem,
        nextCursor: hasMore ? items.at(-1)?.debtTimestamp : undefined,
      };
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

        return {
          ...asset,
          latestQuantity,
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
        archivedAt: yup.date().nullable(),
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
  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const timestamp = toMonthTimestamp(new Date());
      const archivedDebt = await ctx.db.$transaction(async (tx) => {
        const { count } = await tx.netWorthDebtQuantity.updateMany({
          where: {
            netWorthDebtId: input.id,
            timestamp: { gte: timestamp, lt: toNextMonthTimestamp(timestamp) },
          },
          data: { quantity: 0, quantityFormula: "0" },
        });
        if (count === 0) {
          await tx.netWorthDebtQuantity.create({
            data: {
              netWorthDebtId: input.id,
              timestamp,
              quantity: 0,
              quantityFormula: "0",
            },
          });
        }

        return tx.netWorthDebt.update({
          where: { id: input.id, createdById: ctx.session.user.id },
          data: { archivedAt: new Date() },
        });
      });

      appEmitter.emit("netWorthDebtQuantity:updated", {
        userId: ctx.session.user.id,
        timestamp,
      });
      return archivedDebt;
    }),
  deleteQuantityByTimestamp: protectedProcedure
    .input(
      yup.object({
        debtId: yup.string().required().label("Debt ID"),
        timestamp: yup.date().label("Date").required(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertActiveDebt(ctx, input.debtId);
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
  createQuantity: protectedProcedure
    .input(createQuantitySchema)
    .mutation(async ({ input, ctx }) => {
      await assertActiveDebt(ctx, input.debtId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsedQuantity: number = evaluate(input.quantity);

      const timestamp = toMonthTimestamp(input.timestamp);
      const existingQuantity = await ctx.db.netWorthDebtQuantity.findFirst({
        where: {
          netWorthDebtId: input.debtId,
          timestamp: {
            gte: timestamp,
            lt: toNextMonthTimestamp(timestamp),
          },
        },
      });
      if (existingQuantity) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "A valuation already exists for this month. Edit the existing valuation instead.",
        });
      }

      const createdQuantity = await ctx.db.netWorthDebtQuantity.create({
        data: {
          quantity: parsedQuantity,
          quantityFormula: input.quantity,
          timestamp,
          netWorthDebt: { connect: { id: input.debtId } },
        },
      });

      appEmitter.emit("netWorthDebtQuantity:updated", {
        userId: ctx.session.user.id,
        timestamp,
      });

      return createdQuantity;
    }),
  updateQuantity: protectedProcedure
    .input(updateQuantitySchema)
    .mutation(async ({ input, ctx }) => {
      await assertActiveDebt(ctx, input.debtId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsedQuantity: number = evaluate(input.quantity);

      const timestamp = toMonthTimestamp(input.timestamp);
      const conflictingQuantity = await ctx.db.netWorthDebtQuantity.findFirst({
        where: {
          netWorthDebtId: input.debtId,
          id: { not: input.id },
          timestamp: { gte: timestamp, lt: toNextMonthTimestamp(timestamp) },
        },
      });
      if (conflictingQuantity) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This debt already has a valuation for that month.",
        });
      }
      const updatedQuantity = await ctx.db.netWorthDebtQuantity.update({
        where: {
          id: input.id,
        },
        data: {
          quantity: parsedQuantity,
          quantityFormula: input.quantity,
          timestamp,
          netWorthDebt: { connect: { id: input.debtId } },
        },
      });

      appEmitter.emit("netWorthDebtQuantity:updated", {
        userId: ctx.session.user.id,
        timestamp,
      });

      return updatedQuantity;
    }),
});

async function assertActiveDebt(
  ctx: Awaited<ReturnType<typeof createTRPCContext>> & {
    session: NonNullable<
      Awaited<ReturnType<typeof createTRPCContext>>["session"]
    >;
  },
  debtId: string,
) {
  const debt = await ctx.db.netWorthDebt.findFirst({
    where: { id: debtId, createdById: ctx.session.user.id },
    select: { archivedAt: true },
  });
  if (!debt) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Debt not found." });
  }
  if (debt.archivedAt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Restore this debt before changing its valuations.",
    });
  }
}
