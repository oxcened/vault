import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { updateFromDate } from "./netWorth";

export const stockPriceRouter = createTRPCRouter({
  // Get all stock price records
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.stockPriceHistory.findMany({
      orderBy: { timestamp: "desc" },
      include: {
        ticker: true,
      },
    });
  }),

  // Create a new stock price record
  create: protectedProcedure
    .input(
      z.object({
        tickerId: z.string(),
        price: z.number().positive(),
        timestamp: z.date(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const timestamp = new Date(input.timestamp);
      timestamp.setUTCHours(0, 0, 0, 0);

      return ctx.db.stockPriceHistory.create({
        data: {
          tickerId: input.tickerId,
          price: input.price,
          timestamp: timestamp,
        },
      });
    }),

  // Update an existing stock price record
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        price: z.number().positive("Price must be a positive number"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const updated = await tx.stockPriceHistory.update({
          where: { id: input.id },
          data: { price: input.price },
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
          });
        }

        return updated;
      });
    }),

  // Delete a stock price record
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.stockPriceHistory.delete({
        where: { id: input.id },
      });
    }),
});
