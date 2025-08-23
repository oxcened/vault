import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const stockTickerRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.stockTicker.findMany({
      orderBy: { name: "asc" },
    });
  }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.stockTicker.delete({
        where: { id: input.id },
      });

      return deleted;
    }),
});
