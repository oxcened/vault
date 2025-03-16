import { getPercentageDiff } from "~/server/utils/financial";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { type PrismaClient } from "@prisma/client";

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
      createdAt: "desc",
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

      const netWorthHistory = await ctx.db.netWorth.findMany({
        where: { createdById: userId },
        orderBy: { timestamp: "desc" },
        take: 2,
        select: {
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

      const cashFlowHistory = await ctx.db.cashFlow.findMany({
        where: {
          createdById: ctx.session.user.id,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 2,
        select: {
          expenses: true,
          income: true,
          netFlow: true,
        },
      });

      const latestCashFlow = cashFlowHistory[0];
      const previousCashFlow = cashFlowHistory[1];

      const cashFlowTrend = getPercentageDiff(
        latestCashFlow?.netFlow,
        previousCashFlow?.netFlow,
      );

      const recentTransactions = await getRecentTransactions({
        db: transaction,
        userId,
      });

      return {
        netWorth: latestNetWorth,
        cashFlow: latestCashFlow,
        recentTransactions,
        netWorthTrend,
        cashFlowTrend,
      };
    });
  }),
});
