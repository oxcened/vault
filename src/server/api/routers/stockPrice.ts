import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
  createStockPriceSchema,
  updateStockPriceSchema,
} from "~/trpc/schemas/stockPrice";
import { recomputeDerivedDataForDependency } from "~/server/utils/db";

export const stockPriceRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.stockPriceHistory.findMany({
      orderBy: { timestamp: "desc" },
      include: {
        ticker: true,
      },
    });
  }),

  create: protectedProcedure
    .input(createStockPriceSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (transaction) => {
        const created = transaction.stockPriceHistory.create({
          data: {
            tickerId: input.tickerId,
            price: input.price,
            timestamp: input.timestamp,
          },
        });

        return created;
      });
    }),

  update: protectedProcedure
    .input(updateStockPriceSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const updated = await tx.stockPriceHistory.update({
          where: { id: input.id },
          data: { price: input.price, timestamp: input.timestamp },
        });

        await recomputeDerivedDataForDependency({
          db: tx,
          dependencyType: "StockPrice",
          dependencyKey: updated.id,
        });

        return updated;
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const deleted = await tx.stockPriceHistory.delete({
          where: { id: input.id },
        });

        await recomputeDerivedDataForDependency({
          db: tx,
          dependencyType: "StockPrice",
          dependencyKey: deleted.id,
        });

        return deleted;
      });
    }),
});
