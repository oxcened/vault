import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Prisma, type PrismaClient } from "@prisma/client";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

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

      return {
        netWorth: latestNetWorth,
        netWorthHistory: netWorthHistory.toReversed().map((snapshot) => ({
          timestamp: snapshot.timestamp,
          value: snapshot.netValue,
        })),
        cashFlow,
        cashFlowHasActivity: currentCashFlow !== null,
        cashFlowHistory,
        recentTransactions,
        cashFlowAvgLast6Months: cashFlowAvgLast6Months._avg,
      };
    });
  }),
});
