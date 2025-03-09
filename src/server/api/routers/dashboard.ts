import { startOfMonth, endOfMonth } from "date-fns";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Prisma } from "@prisma/client";

export const dashboardRouter = createTRPCRouter({
  getSummary: protectedProcedure.query(async ({ input, ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new Error("Unauthorized");

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

    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());

    // TODO:
    // Totals should be cached so that we don't have to query transactions each time
    const transactions = await ctx.db.transaction.findMany({
      where: {
        createdById: userId,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: {
        createdAt: "desc",
      },
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

    let totalIncome = new Prisma.Decimal(0);
    let totalExpenses = new Prisma.Decimal(0);

    for (const txn of transactions) {
      if (txn.type === "INCOME") totalIncome = totalIncome.plus(txn.amount);
      if (txn.type === "EXPENSE")
        totalExpenses = totalExpenses.plus(txn.amount);
    }

    const cashFlow = totalIncome.minus(totalExpenses);

    const recentTransactions = transactions.slice(0, 5);

    const latestNetWorth = netWorthHistory[0];

    const netWorthTrend = (function calculatePercentageChange(
      nwThis?: Prisma.Decimal,
      nwLast?: Prisma.Decimal,
    ) {
      if (nwLast === undefined || nwThis === undefined) return undefined;
      if (nwLast.eq(0))
        return nwThis.gt(0)
          ? new Prisma.Decimal(100)
          : nwThis.lt(0)
            ? new Prisma.Decimal(-100)
            : new Prisma.Decimal(0);
      return nwThis.minus(nwLast).div(nwLast.abs());
    })(netWorthHistory[0]?.netValue, netWorthHistory[1]?.netValue);

    return {
      netWorth: latestNetWorth?.netValue || new Prisma.Decimal(0),
      totalAssets: latestNetWorth?.totalAssets || new Prisma.Decimal(0),
      totalDebts: latestNetWorth?.totalDebts || new Prisma.Decimal(0),
      totalIncome,
      totalExpenses,
      cashFlow,
      recentTransactions,
      netWorthHistory: netWorthHistory.reverse(),
      netWorthTrend,
    };
  }),
});
