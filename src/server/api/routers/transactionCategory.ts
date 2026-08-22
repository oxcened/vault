import { TransactionCategoryType } from "@prisma/client";
import * as yup from "yup";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  createTransactionCategorySchema,
  updateTransactionCategorySchema,
} from "~/trpc/schemas/transactionCategory";

export const transactionCategoryRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.transactionCategory.findMany({
      orderBy: { name: "asc" },
    });
  }),
  getByType: protectedProcedure
    .input(
      yup.object({
        type: yup
          .array(
            yup
              .string<TransactionCategoryType>()
              .required()
              .oneOf(Object.values(TransactionCategoryType)),
          )
          .required(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.transactionCategory.findMany({
        orderBy: { name: "asc" },
        where: {
          type: {
            in: input.type,
          },
        },
      });
    }),
  create: protectedProcedure
    .input(createTransactionCategorySchema)
    .mutation(({ input, ctx }) =>
      ctx.db.transactionCategory.create({ data: input }),
    ),
  update: protectedProcedure
    .input(updateTransactionCategorySchema)
    .mutation(({ input, ctx }) => {
      const { id, ...data } = input;
      return ctx.db.transactionCategory.update({ where: { id }, data });
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.transactionCategory.delete({
        where: { id: input.id },
      });

      return deleted;
    }),
});
