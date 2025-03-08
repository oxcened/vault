import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const transactionRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.transaction.findMany({
      where : {
        createdById: ctx.session.user.id
      },
      orderBy: { timestamp: "desc" },
      include: {
        category: true,
      },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        currency: z.string().length(3),
        amount: z.number(),
        timestamp: z.date(),
        description: z.string(),
        type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
        categoryId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.transaction.create({
        data: {
          timestamp: input.timestamp,
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          type: input.type,
          category: { connect: { id: input.categoryId } },
          createdBy: { connect: { id: ctx.session.user.id } }
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.transaction.delete({
        where: { id: input.id },
      });
    }),
});
