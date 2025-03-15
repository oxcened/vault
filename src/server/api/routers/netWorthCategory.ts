import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const netWorthCategoryRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.netWorthCategory.findMany({
      orderBy: { name: "asc" },
    });
  }),
});
