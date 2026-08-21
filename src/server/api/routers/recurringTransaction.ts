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
    .mutation(({ ctx, input }) =>
      ctx.db.recurringTransaction.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
        },
      }),
    ),

  update: protectedProcedure
    .input(updateRecurringTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.recurringTransaction.update({
        where: { id, createdById: ctx.session.user.id },
        data,
      });
    }),

  post: protectedProcedure
    .input(ownedScheduleInput)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.$transaction(async (tx) => {
        const schedule = await tx.recurringTransaction.findFirstOrThrow({
          where: { id: input.id, createdById: ctx.session.user.id },
        });
        const transaction = await tx.transaction.create({
          data: {
            description: schedule.description,
            amount: schedule.amount,
            currency: schedule.currency,
            type: schedule.type,
            categoryId: schedule.categoryId,
            timestamp: schedule.nextDate,
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
