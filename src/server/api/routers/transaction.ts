import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { updateCashFlowFromDate } from "~/server/utils/db";
import { createTransactionSchema } from "~/trpc/schemas/transaction";

export const transactionRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.transaction.findMany({
      where: {
        createdById: ctx.session.user.id,
      },
      orderBy: { timestamp: "desc" },
      // TODO introduce pagination
      take: 100,
      select: {
        id: true,
        amount: true,
        currency: true,
        createdById: true,
        timestamp: true,
        createdAt: true,
        description: true,
        type: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });
  }),

  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ input, ctx }) => {
      const transaction = await ctx.db.transaction.create({
        data: {
          timestamp: input.timestamp,
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          type: input.type,
          category: { connect: { id: input.categoryId } },
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });

      await updateCashFlowFromDate({
        db: ctx.db,
        createdBy: ctx.session.user.id,
        date: input.timestamp,
      });

      return transaction;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const transaction = await ctx.db.transaction.delete({
        where: { id: input.id },
      });

      const date = new Date(transaction.timestamp);

      await updateCashFlowFromDate({
        db: ctx.db,
        createdBy: ctx.session.user.id,
        date,
      });

      return transaction;
    }),
});
