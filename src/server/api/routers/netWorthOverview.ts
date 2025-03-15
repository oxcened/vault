import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getPercentageDiff } from "~/server/utils/financial";

export const netWorthOverviewRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const netWorthHistory = await ctx.db.netWorth.findMany({
      where: { createdById: userId },
      orderBy: { timestamp: "desc" },
      take: 12, // a year
      select: {
        id: true,
        netValue: true,
        totalAssets: true,
        totalDebts: true,
        timestamp: true,
      },
    });

    const latestNetWorth = netWorthHistory[0];
    const previousNetWorth = netWorthHistory[1];

    const netWorthTrend = getPercentageDiff(
      latestNetWorth?.netValue,
      previousNetWorth?.netValue,
    );

    netWorthHistory.reverse();

    return {
      netWorthHistory,
      netWorthTrend,
      latestNetWorth,
    };
  }),
});
