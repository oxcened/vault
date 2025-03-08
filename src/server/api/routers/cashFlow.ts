import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { startOfMonth, endOfMonth } from "date-fns";
import { Prisma } from "@prisma/client";

export const cashFlowRouter = createTRPCRouter({
  getMonthlyCashFlow: protectedProcedure.query(async ({ input, ctx }) => {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    // Fetch transactions within this month
    const transactions = await ctx.db.transaction.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        createdById: ctx.session.user.id,
      },
      orderBy: {
        category: {
          name: "asc",
        },
      },
      include: {
        category: true,
      },
    });

    // Group transactions by category and sum amounts
    const cashFlow: Record<
      string,
      {
        category: string;
        totalSpent: Prisma.Decimal;
        totalEarned: Prisma.Decimal;
        netAmount: Prisma.Decimal;
      }
    > = {};

    let totalSpent = new Prisma.Decimal(0);
    let totalEarned = new Prisma.Decimal(0);

    for (const transaction of transactions) {
      const categoryName = transaction.category.name;

      if (!cashFlow[categoryName]) {
        cashFlow[categoryName] = {
          category: categoryName,
          totalSpent: new Prisma.Decimal(0),
          totalEarned: new Prisma.Decimal(0),
          netAmount: new Prisma.Decimal(0),
        };
      }

      if (transaction.type === "EXPENSE") {
        cashFlow[categoryName].totalSpent = cashFlow[
          categoryName
        ].totalSpent.plus(transaction.amount);
        totalSpent = totalSpent.plus(transaction.amount);
      } else if (transaction.type === "INCOME") {
        cashFlow[categoryName].totalEarned = cashFlow[
          categoryName
        ].totalEarned.plus(transaction.amount);
        totalEarned = totalEarned.plus(transaction.amount);
      }

      cashFlow[categoryName].netAmount = cashFlow[categoryName].netAmount.plus(
        transaction.amount.mul(
          new Prisma.Decimal(transaction.type === "EXPENSE" ? -1 : 1),
        ),
      );
    }

    const savings = totalEarned.minus(totalSpent);

    return {
      cashFlow: Object.values(cashFlow), // Convert object to array
      totalSpent,
      totalEarned,
      savings,
    };
  }),
});
