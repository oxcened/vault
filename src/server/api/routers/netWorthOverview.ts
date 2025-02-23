import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getLatest as getNetWorth } from "./netWorth";
import { aggregateAll as getNetWorthAssets } from "./netWorthAsset";

export const netWorthOverviewRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const netWorth = await getNetWorth({
      db: ctx.db,
    });

    const netWorthAssets = await getNetWorthAssets(ctx.db);

    return {
      netWorth,
      netWorthAssets: netWorthAssets[0],
    };
  }),
});
