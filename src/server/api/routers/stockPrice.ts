import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { updateFromDate } from "./netWorth";
import {
  createStockPriceSchema,
  updateStockPriceSchema,
} from "~/trpc/schemas/stockPrice";

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
        const timestamp = new Date(input.timestamp);
        timestamp.setUTCHours(0, 0, 0, 0);

        const created = transaction.stockPriceHistory.create({
          data: {
            tickerId: input.tickerId,
            price: input.price,
            timestamp: timestamp,
          },
        });

        if (timestamp) {
          await updateFromDate({
            db: transaction,
            date: timestamp,
            createdBy: ctx.session.user.id,
          });
        }

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
          include: { ticker: true },
        });

        const earliest = await tx.netWorthAssetQuantity.findFirst({
          where: {
            netWorthAsset: {
              tickerId: updated.tickerId,
            },
          },
          orderBy: {
            timestamp: "asc",
          },
        });

        if (earliest) {
          await updateFromDate({
            db: tx,
            date: earliest.timestamp,
            createdBy: ctx.session.user.id,
          });
        }

        return updated;
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.stockPriceHistory.delete({
        where: { id: input.id },
      });
    }),
});
