import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { startOfMonth, endOfMonth } from "date-fns";
import { Prisma, PrismaClient } from "@prisma/client";
import { DECIMAL_ZERO } from "~/utils/number";

async function getCashFlowByCategory({
  db,
  userId,
}: {
  db: Pick<PrismaClient, "transaction">;
  userId: string;
}) {
  const startDate = startOfMonth(new Date());
  const endDate = endOfMonth(new Date());

  const transactions = await db.transaction.findMany({
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

  const cashFlowByCategory: Record<
    string,
    {
      category: string;
      expenses: Prisma.Decimal;
      income: Prisma.Decimal;
      netFlow: Prisma.Decimal;
    }
  > = {};

  for (const transaction of transactions) {
    const categoryName = transaction.category.name;

    if (!cashFlowByCategory[categoryName]) {
      cashFlowByCategory[categoryName] = {
        category: categoryName,
        expenses: DECIMAL_ZERO,
        income: DECIMAL_ZERO,
        netFlow: DECIMAL_ZERO,
      };
    }

    if (transaction.type === "EXPENSE") {
      cashFlowByCategory[categoryName].expenses = cashFlowByCategory[
        categoryName
      ].expenses.plus(transaction.amount);
    } else if (transaction.type === "INCOME") {
      cashFlowByCategory[categoryName].income = cashFlowByCategory[
        categoryName
      ].income.plus(transaction.amount);
    }

    cashFlowByCategory[categoryName].netFlow = cashFlowByCategory[
      categoryName
    ].netFlow.plus(
      transaction.amount.mul(
        new Prisma.Decimal(transaction.type === "EXPENSE" ? -1 : 1),
      ),
    );
  }

  return Object.values(cashFlowByCategory);
}

export const cashFlowRouter = createTRPCRouter({
  getMonthlyCashFlow: protectedProcedure.query(async ({ input, ctx }) => {
    const cashFlowByMonth = await ctx.db.cashFlow.findMany({
      where: {
        createdById: ctx.session.user.id,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 12, // a year
    });

    const latestCashFlow = cashFlowByMonth[0];

    cashFlowByMonth.reverse();

    const cashFlowByCategory = await getCashFlowByCategory({
      db: ctx.db,
      userId: ctx.session.user.id,
    });

    return {
      cashFlowByCategory,
      cashFlowByMonth,
      latestCashFlow: latestCashFlow,
    };
  }),
});
