import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { startOfMonth, endOfMonth } from "date-fns";
import { Prisma, type PrismaClient } from "@prisma/client";
import { DECIMAL_ZERO } from "~/utils/number";
import { getPercentageDiff } from "~/server/utils/financial";
import { z } from "zod";

async function getCashFlowByCategory({
  db,
  userId,
  date,
}: {
  db: Pick<PrismaClient, "transaction">;
  userId: string;
  date: Date;
}) {
  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);

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
          id: true,
          name: true,
        },
      },
    },
  });

  const cashFlowByCategory: Record<
    string,
    {
      categoryId: string;
      category: string;
      expenses: Prisma.Decimal;
      income: Prisma.Decimal;
      netFlow: Prisma.Decimal;
    }
  > = {};

  for (const transaction of transactions) {
    const categoryId = transaction.category.id;
    const categoryName = transaction.category.name;

    if (!cashFlowByCategory[categoryId]) {
      cashFlowByCategory[categoryId] = {
        categoryId,
        category: categoryName,
        expenses: DECIMAL_ZERO,
        income: DECIMAL_ZERO,
        netFlow: DECIMAL_ZERO,
      };
    }

    if (transaction.type === "EXPENSE") {
      cashFlowByCategory[categoryId].expenses = cashFlowByCategory[
        categoryId
      ].expenses.plus(transaction.amount);
    } else if (transaction.type === "INCOME") {
      cashFlowByCategory[categoryId].income = cashFlowByCategory[
        categoryId
      ].income.plus(transaction.amount);
    }

    cashFlowByCategory[categoryId].netFlow = cashFlowByCategory[
      categoryId
    ].netFlow.plus(
      transaction.amount.mul(
        new Prisma.Decimal(transaction.type === "EXPENSE" ? -1 : 1),
      ),
    );
  }

  return Object.values(cashFlowByCategory).toSorted((a, b) => {
    return b.netFlow.abs().minus(a.netFlow.abs()).toNumber();
  });
}

export const cashFlowRouter = createTRPCRouter({
  getMonthlyCashFlow: protectedProcedure
    .input(z.object({ categoryDate: z.date().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const cashFlowByMonth = await ctx.db.cashFlow.findMany({
        where: {
          createdById: ctx.session.user.id,
          timestamp: {
            lte: endOfMonth(new Date()),
          },
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      const latestCashFlow = cashFlowByMonth[0];
      const previousCashFlow = cashFlowByMonth[1];

      const cashFlowTrend =
        previousCashFlow && !previousCashFlow.netFlow.eq(0)
          ? getPercentageDiff(latestCashFlow?.netFlow, previousCashFlow.netFlow)
          : undefined;
      const cashFlowChange = latestCashFlow?.netFlow.minus(
        previousCashFlow?.netFlow ?? latestCashFlow.netFlow,
      );

      cashFlowByMonth.reverse();

      const cashFlowByCategory = await getCashFlowByCategory({
        db: ctx.db,
        userId: ctx.session.user.id,
        date: input?.categoryDate ?? new Date(),
      });

      return {
        cashFlowByCategory,
        cashFlowByMonth,
        latestCashFlow,
        cashFlowTrend,
        cashFlowChange,
        previousCashFlow,
      };
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.cashFlow.findMany({
      where: {
        createdById: ctx.session.user.id,
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  }),
});
