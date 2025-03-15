import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const stockTickerRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.stockTicker.findMany({
      orderBy: { name: "asc" },
    });
  }),
});
