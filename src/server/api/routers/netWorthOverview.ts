import { type Prisma } from "@prisma/client";
import { endOfMonth } from "date-fns";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  getAssetValuesForUserMonth,
  getDebtValuesForUserMonth,
} from "~/server/utils/db";
import { getPercentageDiff } from "~/server/utils/financial";
import { DECIMAL_ZERO } from "~/utils/number";

type CategoryAllocation = {
  category: string;
  value: Prisma.Decimal;
  percentage: Prisma.Decimal;
};

function aggregateCategories(
  values: Array<{ categoryName: string; valueInTarget: Prisma.Decimal }>,
  total: Prisma.Decimal,
) {
  const categories = new Map<string, Prisma.Decimal>();
  for (const item of values) {
    categories.set(
      item.categoryName,
      (categories.get(item.categoryName) ?? DECIMAL_ZERO).plus(
        item.valueInTarget,
      ),
    );
  }

  return [...categories.entries()]
    .map<CategoryAllocation>(([category, value]) => ({
      category,
      value,
      percentage: total.eq(0) ? DECIMAL_ZERO : value.div(total),
    }))
    .filter(({ value }) => !value.eq(0))
    .toSorted((a, b) => b.value.abs().minus(a.value.abs()).toNumber());
}

export const netWorthOverviewRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const netWorthHistory = await ctx.db.netWorth.findMany({
      where: {
        createdById: userId,
        timestamp: { lte: endOfMonth(new Date()) },
      },
      orderBy: { timestamp: "desc" },
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
    const netWorthChange = latestNetWorth?.netValue.minus(
      previousNetWorth?.netValue ?? latestNetWorth.netValue,
    );
    const netWorthTrend =
      previousNetWorth && !previousNetWorth.netValue.eq(0)
        ? getPercentageDiff(latestNetWorth?.netValue, previousNetWorth.netValue)
        : undefined;

    if (!latestNetWorth) {
      return {
        netWorthHistory: [],
        latestNetWorth: undefined,
        previousNetWorth: undefined,
        netWorthChange: undefined,
        netWorthTrend: undefined,
        assetByCategory: [],
        debtByCategory: [],
        holdingChanges: [],
      };
    }

    const [assets, debts, previousAssets, previousDebts] = await Promise.all([
      getAssetValuesForUserMonth({
        db: ctx.db,
        startDate: latestNetWorth.timestamp,
        userId,
      }),
      getDebtValuesForUserMonth({
        db: ctx.db,
        startDate: latestNetWorth.timestamp,
        userId,
      }),
      previousNetWorth
        ? getAssetValuesForUserMonth({
            db: ctx.db,
            startDate: previousNetWorth.timestamp,
            userId,
          })
        : Promise.resolve([]),
      previousNetWorth
        ? getDebtValuesForUserMonth({
            db: ctx.db,
            startDate: previousNetWorth.timestamp,
            userId,
          })
        : Promise.resolve([]),
    ]);

    const previousAssetValues = new Map(
      previousAssets.map((item) => [item.assetId, item.valueInTarget]),
    );
    const previousDebtValues = new Map(
      previousDebts.map((item) => [item.debtId, item.valueInTarget]),
    );
    const holdingChanges = previousNetWorth
      ? [
          ...assets.map((item) => ({
            id: item.assetId,
            name: item.assetName,
            category: item.categoryName,
            kind: "asset" as const,
            change: item.valueInTarget.minus(
              previousAssetValues.get(item.assetId) ?? DECIMAL_ZERO,
            ),
          })),
          ...debts.map((item) => ({
            id: item.debtId,
            name: item.debtName,
            category: item.categoryName,
            kind: "debt" as const,
            change: (previousDebtValues.get(item.debtId) ?? DECIMAL_ZERO).minus(
              item.valueInTarget,
            ),
          })),
        ]
          .filter(({ change }) => !change.eq(0))
          .toSorted((a, b) => b.change.abs().minus(a.change.abs()).toNumber())
      : [];

    netWorthHistory.reverse();
    return {
      netWorthHistory,
      latestNetWorth,
      previousNetWorth,
      netWorthChange,
      netWorthTrend,
      assetByCategory: aggregateCategories(assets, latestNetWorth.totalAssets),
      debtByCategory: aggregateCategories(debts, latestNetWorth.totalDebts),
      holdingChanges,
    };
  }),
});
