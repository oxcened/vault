import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
  createStockPriceSchema,
  updateStockPriceSchema,
} from "~/trpc/schemas/stockPrice";
import { appEmitter } from "~/server/eventBus";
import * as yup from "yup";

export const stockPriceRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      yup.object({
        tickerId: yup.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.db.stockPriceHistory.findMany({
        where: {
          tickerId: input.tickerId,
        },
        orderBy: { timestamp: "desc" },
        include: {
          ticker: true,
        },
      });
    }),

  create: protectedProcedure
    .input(createStockPriceSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.stockPriceHistory.create({
        data: {
          tickerId: input.tickerId,
          price: input.price,
          timestamp: input.timestamp,
        },
      });
    }),

  update: protectedProcedure
    .input(updateStockPriceSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.stockPriceHistory.update({
        where: { id: input.id },
        data: { price: input.price, timestamp: input.timestamp },
      });

      appEmitter.emit("stockPrice:updated", { stockPriceId: updated.id });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.stockPriceHistory.delete({
        where: { id: input.id },
      });

      appEmitter.emit("stockPrice:updated", { stockPriceId: deleted.id });

      return deleted;
    }),
});
