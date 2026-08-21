import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { updateTransactionSchema } from "~/trpc/schemas/transaction";

export const transactionTemplateRouter = createTRPCRouter({
  getFrequent: protectedProcedure.query(async ({ ctx }) => {
    const transactions = await ctx.db.transaction.findMany({
      where: {
        createdById: ctx.session.user.id,
        status: "POSTED",
      },
      orderBy: [{ timestamp: "desc" }, { updatedAt: "desc" }],
      take: 200,
      select: {
        id: true,
        amount: true,
        currency: true,
        description: true,
        type: true,
        categoryId: true,
        category: { select: { name: true } },
      },
    });

    const frequent = new Map<
      string,
      (typeof transactions)[number] & { count: number }
    >();

    for (const transaction of transactions) {
      const key = [
        transaction.description.trim().toLocaleLowerCase(),
        transaction.amount.toString(),
        transaction.currency,
        transaction.type,
        transaction.categoryId,
      ].join("|");
      const existing = frequent.get(key);
      if (existing) existing.count += 1;
      else frequent.set(key, { ...transaction, count: 1 });
    }

    return [...frequent.values()]
      .filter(({ count }) => count >= 2)
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.transactionTemplate.findMany({
      where: {
        createdById: ctx.session.user.id,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        currency: true,
        createdAt: true,
        description: true,
        type: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });
  }),

  create: protectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const transaction = await ctx.db.transaction.findFirstOrThrow({
        where: {
          id: input.transactionId,
          createdById: ctx.session.user.id,
        },
      });

      return ctx.db.transactionTemplate.create({
        data: {
          amount: transaction.amount,
          currency: transaction.currency,
          description: transaction.description,
          type: transaction.type,
          category: { connect: { id: transaction.categoryId } },
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.transactionTemplate.delete({
        where: { id: input.id, createdById: ctx.session.user.id },
      });

      return deleted;
    }),

  update: protectedProcedure
    .input(updateTransactionSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, amount, categoryId, currency, description, type } = input;
      return ctx.db.transactionTemplate.update({
        where: { id, createdById: ctx.session.user.id },
        data: { amount, categoryId, currency, description, type },
      });
    }),
});
