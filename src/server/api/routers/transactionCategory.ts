import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const transactionCategoryRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.transactionCategory.findMany({
      orderBy: { name: "asc" },
    });
  }),
});
