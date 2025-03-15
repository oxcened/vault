import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import * as yup from "yup";
import { NetWorthCategoryType } from "@prisma/client";

export const netWorthCategoryRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.netWorthCategory.findMany({
      orderBy: { name: "asc" },
    });
  }),
  getByType: protectedProcedure
    .input(
      yup.object({
        type: yup
          .array(
            yup
              .string<NetWorthCategoryType>()
              .required()
              .oneOf(Object.values(NetWorthCategoryType)),
          )
          .required(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.netWorthCategory.findMany({
        orderBy: { name: "asc" },
        where: {
          type: {
            in: input.type,
          },
        },
      });
    }),
});
