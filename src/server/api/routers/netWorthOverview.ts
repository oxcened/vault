import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getLatest as getNetWorth } from "./netWorth";

export const netWorthOverviewRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const netWorth = await getNetWorth({
      db: ctx.db,
    });

    return netWorth;
  }),
});
