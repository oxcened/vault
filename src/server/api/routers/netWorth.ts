import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { updateNetWorthFromDate } from "~/server/utils/db";

export const netWorthRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.netWorth.findMany({
      orderBy: { timestamp: "desc" },
    });
  }),
  getByDate: protectedProcedure
    .input(
      z.object({
        date: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setUTCHours(0, 0, 0, 0);

      return ctx.db.netWorth.findFirst({
        where: {
          timestamp: date,
        },
      });
    }),
  getLatest: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.netWorth.findFirst({
      orderBy: {
        timestamp: "desc",
      },
    });
  }),
  updateFromDate: protectedProcedure
    .input(
      z.object({
        date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return updateNetWorthFromDate({
        db: ctx.db,
        date: input.date,
        createdBy: ctx.session.user.id,
      });
    }),
});
