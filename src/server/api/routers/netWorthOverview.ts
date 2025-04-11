import { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getAssetValuesForUserMonth } from "~/server/utils/db";
import { getPercentageDiff } from "~/server/utils/financial";
import { DECIMAL_ZERO } from "~/utils/number";

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

    const assetByCategory = await (async () => {
      const assets = await getAssetValuesForUserMonth({
        db: ctx.db,
        startDate: new Date(),
        userId: ctx.session.user.id,
      });

      const assetByCategory: Record<
        string,
        {
          category: string;
          value: Prisma.Decimal;
          percentage: Prisma.Decimal;
        }
      > = {};

      for (const asset of assets) {
        const categoryName = asset.categoryName;

        if (!assetByCategory[categoryName]) {
          assetByCategory[categoryName] = {
            category: categoryName,
            value: DECIMAL_ZERO,
            percentage: DECIMAL_ZERO,
          };
        }

        assetByCategory[categoryName].value = assetByCategory[
          categoryName
        ].value.plus(asset.valueInTarget);

        assetByCategory[categoryName].percentage = assetByCategory[
          categoryName
        ].value.div(latestNetWorth?.totalAssets ?? DECIMAL_ZERO);
      }

      return Object.values(assetByCategory).toSorted((a, b) => {
        return b.value.abs().minus(a.value.abs()).toNumber();
      });
    })();

    return {
      netWorthHistory,
      netWorthTrend,
      latestNetWorth,
      assetByCategory,
    };
  }),
});
