import { TransactionCategoryType } from "@prisma/client";
import * as yup from "yup";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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
});
