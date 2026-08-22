import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import { RecurrenceFrequency, TransactionStatus } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { appEmitter } from "~/server/eventBus";
import {
  recurringTransactionSchema,
  updateRecurringTransactionSchema,
} from "~/trpc/schemas/recurring-transaction";

function getNextDate(
  date: Date,
  frequency: RecurrenceFrequency,
  interval: number,
) {
  switch (frequency) {
    case RecurrenceFrequency.DAILY:
      return addDays(date, interval);
    case RecurrenceFrequency.WEEKLY:
      return addWeeks(date, interval);
    case RecurrenceFrequency.MONTHLY:
      return addMonths(date, interval);
    case RecurrenceFrequency.YEARLY:
      return addYears(date, interval);
  }
}

const ownedScheduleInput = z.object({ id: z.string() });

export const recurringTransactionRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) =>
    ctx.db.recurringTransaction.findMany({
      where: { createdById: ctx.session.user.id },
      orderBy: [{ isPaused: "asc" }, { nextDate: "asc" }],
      include: { category: { select: { name: true } } },
    }),
  ),

  create: protectedProcedure
    .input(recurringTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.transactionCategory.findUnique({
        where: { id: input.categoryId },
        select: { type: true },
      });

      if (!category) {
        throw new Error("Category not found.");
      }

      if (category.type !== input.type) {
        throw new Error(
          `Cannot assign a ${category.type.toLowerCase()} category to a ${input.type.toLowerCase()} transaction.`,
        );
      }

      return ctx.db.recurringTransaction.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(updateRecurringTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.db.recurringTransaction.findUnique({
        where: { id, createdById: ctx.session.user.id },
        select: { type: true, categoryId: true },
      });

      if (!existing) {
        throw new Error("Schedule not found.");
      }

      const newType = data.type ?? existing.type;
      const newCategoryId = data.categoryId ?? existing.categoryId;

      if (newCategoryId !== existing.categoryId || newType !== existing.type) {
        const category = await ctx.db.transactionCategory.findUnique({
          where: { id: newCategoryId },
          select: { type: true },
        });

        if (!category) {
          throw new Error("Category not found.");
        }

        if (category.type !== newType) {
          throw new Error(
            `Cannot assign a ${category.type.toLowerCase()} category to a ${newType.toLowerCase()} transaction.`,
          );
        }
      }

      return ctx.db.recurringTransaction.update({
        where: { id, createdById: ctx.session.user.id },
        data,
      });
    }),

  post: protectedProcedure
    .input(ownedScheduleInput.extend({ recordNow: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.$transaction(async (tx) => {
        const schedule = await tx.recurringTransaction.findFirstOrThrow({
          where: { id: input.id, createdById: ctx.session.user.id },
        });
        const now = new Date();
        const transaction = await tx.transaction.create({
          data: {
            description: schedule.description,
            amount: schedule.amount,
            currency: schedule.currency,
            type: schedule.type,
            categoryId: schedule.categoryId,
            timestamp:
              input.recordNow || schedule.nextDate > now
                ? now
                : schedule.nextDate,
            status: TransactionStatus.POSTED,
            createdById: ctx.session.user.id,
          },
        });
        await tx.recurringTransaction.update({
          where: { id: schedule.id },
          data: {
            nextDate: getNextDate(
              schedule.nextDate,
              schedule.frequency,
              schedule.interval,
            ),
          },
        });
        return transaction;
      });

      appEmitter.emit("transaction:updated", {
        userId: ctx.session.user.id,
        timestamp: result.timestamp,
      });
      return result;
    }),

  skip: protectedProcedure
    .input(ownedScheduleInput)
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.db.recurringTransaction.findFirstOrThrow({
        where: { id: input.id, createdById: ctx.session.user.id },
      });
      return ctx.db.recurringTransaction.update({
        where: { id: schedule.id },
        data: {
          nextDate: getNextDate(
            schedule.nextDate,
            schedule.frequency,
            schedule.interval,
          ),
        },
      });
    }),

  setPaused: protectedProcedure
    .input(ownedScheduleInput.extend({ isPaused: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.db.recurringTransaction.update({
        where: { id: input.id, createdById: ctx.session.user.id },
        data: { isPaused: input.isPaused },
      }),
    ),

  delete: protectedProcedure
    .input(ownedScheduleInput)
    .mutation(({ ctx, input }) =>
      ctx.db.recurringTransaction.delete({
        where: { id: input.id, createdById: ctx.session.user.id },
      }),
    ),
});
