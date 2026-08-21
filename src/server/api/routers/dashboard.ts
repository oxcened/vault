import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Prisma, type PrismaClient } from "@prisma/client";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import {
  getAssetValuesForUserMonth,
  getConvertedTransactionsForUserMonth,
  getDebtValuesForUserMonth,
} from "~/server/utils/db";

async function getRecentTransactions({
  db,
  userId,
}: {
  db: Pick<PrismaClient, "transaction">;
  userId: string;
}) {
  return db.transaction.findMany({
    where: {
      createdById: userId,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: 5,
    select: {
      id: true,
      amount: true,
      currency: true,
      createdById: true,
      timestamp: true,
      createdAt: true,
      description: true,
      type: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });
}

export const dashboardRouter = createTRPCRouter({
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.$transaction(async (transaction) => {
      const userId = ctx.session.user.id;
      const now = new Date();

      const netWorthHistory = await ctx.db.netWorth.findMany({
        where: {
          createdById: userId,
          timestamp: { lte: now },
        },
        orderBy: { timestamp: "desc" },
        take: 6,
        select: {
          netValue: true,
          totalAssets: true,
          totalDebts: true,
          timestamp: true,
        },
      });

      const latestNetWorth = netWorthHistory[0];
      const previousNetWorth = netWorthHistory[1];
      const assetValues = await getAssetValuesForUserMonth({
        db: transaction,
        userId,
        startDate: latestNetWorth?.timestamp ?? now,
      });
      const liquidAssets = assetValues.reduce(
        (total, asset) =>
          asset.isLiquid ? total.plus(asset.valueInTarget) : total,
        new Prisma.Decimal(0),
      );

      const [previousAssetValues, currentDebtValues, previousDebtValues] =
        previousNetWorth
          ? await Promise.all([
              getAssetValuesForUserMonth({
                db: transaction,
                userId,
                startDate: previousNetWorth.timestamp,
              }),
              getDebtValuesForUserMonth({
                db: transaction,
                userId,
                startDate: latestNetWorth?.timestamp ?? now,
              }),
              getDebtValuesForUserMonth({
                db: transaction,
                userId,
                startDate: previousNetWorth.timestamp,
              }),
            ])
          : [[], [], []];

      const previousAssetsById = new Map(
        previousAssetValues.map((asset) => [asset.assetId, asset]),
      );
      const previousDebtsById = new Map(
        previousDebtValues.map((debt) => [debt.debtId, debt]),
      );
      const holdingChanges = previousNetWorth
        ? [
            ...assetValues.map((asset) => ({
              id: asset.assetId,
              name: asset.assetName,
              kind: "asset" as const,
              change: asset.valueInTarget.minus(
                previousAssetsById.get(asset.assetId)?.valueInTarget ?? 0,
              ),
            })),
            ...currentDebtValues.map((debt) => ({
              id: debt.debtId,
              name: debt.debtName,
              kind: "debt" as const,
              change: (
                previousDebtsById.get(debt.debtId)?.valueInTarget ??
                new Prisma.Decimal(0)
              ).minus(debt.valueInTarget),
            })),
          ]
            .filter((holding) => !holding.change.eq(0))
            .toSorted((a, b) => b.change.abs().minus(a.change.abs()).toNumber())
            .slice(0, 3)
        : [];
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const currentCashFlow = await ctx.db.cashFlow.findFirst({
        where: {
          createdById: userId,
          timestamp: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
        select: {
          expenses: true,
          income: true,
          netFlow: true,
        },
      });

      const cashFlow = currentCashFlow ?? {
        expenses: new Prisma.Decimal(0),
        income: new Prisma.Decimal(0),
        netFlow: new Prisma.Decimal(0),
      };

      const recentTransactions = await getRecentTransactions({
        db: transaction,
        userId,
      });

      const cashFlowAvgLast6Months = await ctx.db.cashFlow.aggregate({
        where: {
          createdById: userId,
          timestamp: {
            gte: startOfMonth(subMonths(now, 6)),
            lt: currentMonthStart,
          },
        },
        _avg: {
          netFlow: true,
          expenses: true,
          income: true,
        },
      });

      const previousCashFlowHistory = await ctx.db.cashFlow.findMany({
        where: {
          createdById: userId,
          timestamp: { lt: currentMonthStart },
        },
        orderBy: { timestamp: "desc" },
        take: 5,
        select: {
          timestamp: true,
          netFlow: true,
        },
      });

      const cashFlowHistory = [
        ...previousCashFlowHistory.toReversed(),
        {
          timestamp: currentMonthStart,
          netFlow: cashFlow.netFlow,
        },
      ];

      const convertedTransactions = await getConvertedTransactionsForUserMonth({
        db: transaction,
        userId,
        date: now,
      });
      const categoryIds = [
        ...new Set(convertedTransactions.map((item) => item.category_id)),
      ];
      const categories = await transaction.transactionCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      });
      const categoryNames = new Map(
        categories.map((category) => [category.id, category.name]),
      );
      const cashFlowByCategory = new Map<
        string,
        {
          id: string;
          name: string;
          type: "INCOME" | "EXPENSE";
          amount: Prisma.Decimal;
        }
      >();

      for (const item of convertedTransactions) {
        if (item.type === "TRANSFER") continue;
        const existing = cashFlowByCategory.get(item.category_id);
        const signedAmount = item.converted_amount.mul(
          item.type === "EXPENSE" ? -1 : 1,
        );

        cashFlowByCategory.set(item.category_id, {
          id: item.category_id,
          name: categoryNames.get(item.category_id) ?? "Uncategorized",
          type: item.type,
          amount: (existing?.amount ?? new Prisma.Decimal(0)).plus(
            signedAmount,
          ),
        });
      }

      const cashFlowChanges = [...cashFlowByCategory.values()]
        .filter((item) => !item.amount.eq(0))
        .toSorted((a, b) => b.amount.abs().minus(a.amount.abs()).toNumber())
        .slice(0, 3);

      return {
        netWorth: latestNetWorth,
        liquidAssets,
        previousNetWorthTimestamp: previousNetWorth?.timestamp,
        netWorthChange: previousNetWorth
          ? latestNetWorth?.netValue.minus(previousNetWorth.netValue)
          : undefined,
        holdingChanges,
        netWorthHistory: netWorthHistory.toReversed().map((snapshot) => ({
          timestamp: snapshot.timestamp,
          value: snapshot.netValue,
        })),
        cashFlow,
        cashFlowHasActivity: currentCashFlow !== null,
        cashFlowHistory,
        cashFlowChanges,
        recentTransactions,
        cashFlowAvgLast6Months: cashFlowAvgLast6Months._avg,
      };
    });
  }),
});
