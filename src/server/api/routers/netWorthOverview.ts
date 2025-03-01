import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getLatest } from "./netWorth";

export const netWorthOverviewRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return getLatest({
      db: ctx.db,
    });
  }),
});
