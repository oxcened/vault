import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import * as yup from "yup";
import { NetWorthCategoryType } from "@prisma/client";
import { z } from "zod";

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
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.netWorthCategory.delete({
        where: { id: input.id },
      });

      return deleted;
    }),
});
