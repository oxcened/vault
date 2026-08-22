import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  createStockTickerSchema,
  updateStockTickerSchema,
} from "~/trpc/schemas/stockTicker";

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
  create: protectedProcedure
    .input(createStockTickerSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.stockTicker.create({
        data: input,
      });
    }),
  update: protectedProcedure
    .input(updateStockTickerSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.stockTicker.update({
        where: { id: input.id },
        data: input,
      });

      return updated;
    }),
});
