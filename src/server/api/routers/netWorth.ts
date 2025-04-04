import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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
      where: {
        createdById: ctx.session.user.id,
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  }),
});
