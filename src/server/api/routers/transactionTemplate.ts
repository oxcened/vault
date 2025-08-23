import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { updateTransactionSchema } from "~/trpc/schemas/transaction";
import { appEmitter } from "~/server/eventBus";

export const transactionTemplateRouter = createTRPCRouter({
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
      const transaction = await ctx.db.transaction.findUniqueOrThrow({
        where: {
          id: input.transactionId,
        },
      });
      console.log(input);

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
        where: { id: input.id },
      });

      return deleted;
    }),

  update: protectedProcedure
    .input(updateTransactionSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.transaction.update({
        where: { id: input.id },
        data: input,
      });

      appEmitter.emit("transaction:updated", {
        userId: ctx.session.user.id,
        timestamp: updated.timestamp,
      });

      return updated;
    }),
});
