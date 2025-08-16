"use client";

import { SidebarTrigger } from "~/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";
import { TableSkeleton } from "~/components/table-skeleton";
import { Currency, RoundedCurrency } from "~/components/ui/number";
import { cn } from "~/lib/utils";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { calculateZeroInclusiveYAxisDomain } from "~/utils/chart";
import { formatDate } from "~/utils/date";
import { TrendIndicator } from "~/components/ui/trend-indicator";
import { APP_CURRENCY } from "~/constants";
import { formatNumber } from "~/utils/number";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const cashFlowByMonthConfig = {
  cashFlow: {
    label: "Cash flow",
    color: "var(--chart-3)",
  },
  income: {
    label: "Income",
    color: "var(--chart-1)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function CashFlowPage() {
  const { data, isPending } = api.cashFlow.getMonthlyCashFlow.useQuery();

  const cashFlowByMonthData = data?.cashFlowByMonth.map((item) => {
    return {
      month: formatDate({
        date: item.timestamp,
        options: {
          dateStyle: undefined,
          month: "short",
        },
      }),
      cashFlow: item?.netFlow.toNumber(),
      income: item?.income.toNumber(),
      expenses: item?.expenses.toNumber(),
    };
  });

  const cashFlowByCategoryData = data?.cashFlowByCategory.map((item) => {
    return {
      category: item.category,
      cashFlow: item?.netFlow.toNumber(),
      fill: item?.netFlow.gte(0)
        ? "rgb(var(--financial-positive))"
        : "rgb(var(--financial-negative))",
    };
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/cash-flow">
                Cash flow
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-5">
        {isPending && <TableSkeleton />}

        {!isPending && (
          <div>
            <p className="text-sm text-muted-foreground">Cash flow</p>

            <div className="flex items-end gap-3">
              <p className="text-3xl font-semibold">
                <RoundedCurrency value={data?.latestCashFlow?.netFlow} />
              </p>
              <TrendIndicator value={data?.cashFlowTrend} />
            </div>

            <div className="mt-5 flex gap-5">
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-sm font-medium">
                  <RoundedCurrency value={data?.latestCashFlow?.income} />
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-sm font-medium">
                  <RoundedCurrency value={data?.latestCashFlow?.expenses} />
                </p>
              </div>
            </div>
          </div>
        )}

        {!isPending && !cashFlowByMonthData?.length && (
          <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don&apos;t have a cash flow history yet
          </div>
        )}

        {!isPending && !!cashFlowByMonthData?.length && (
          <Card>
            <CardHeader>
              <CardTitle>Cash flow history</CardTitle>
              <CardDescription>Last 12 months</CardDescription>
            </CardHeader>

            <CardContent>
              <ChartContainer
                config={cashFlowByMonthConfig}
                className="h-[15rem] w-full"
              >
                <ComposedChart accessibilityLayer data={cashFlowByMonthData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={calculateZeroInclusiveYAxisDomain}
                    tickFormatter={(value: number) =>
                      formatNumber({
                        value,
                        options: {
                          style: "currency",
                          currency: APP_CURRENCY,
                          maximumFractionDigits: 0,
                        },
                      })
                    }
                  />

                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />

                  <Bar
                    dataKey="income"
                    fill="var(--color-income)"
                    barSize={30}
                    radius={4}
                    name="Income"
                  />

                  <Bar
                    dataKey="expenses"
                    fill="var(--color-expenses)"
                    barSize={30}
                    radius={4}
                    name="Expenses"
                  />

                  <Line
                    dataKey="cashFlow"
                    type="monotone"
                    stroke="var(--color-cashFlow)"
                    strokeWidth={3}
                    dot={false}
                    name="Cash flow"
                  />

                  <Legend />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {!isPending && !cashFlowByCategoryData?.length && (
          <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don&apos;t have a cash flow this month yet
          </div>
        )}

        {!isPending && !!cashFlowByCategoryData?.length && (
          <Card>
            <CardHeader>
              <CardTitle>Cash flow by category</CardTitle>
              <CardDescription>Current month</CardDescription>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-32 text-right">Cash flow</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.cashFlowByCategory.map((category) => (
                    <TableRow key={category.category}>
                      <TableCell>{category.category}</TableCell>
                      <TableCell className="text-right">
                        <Currency
                          value={category.netFlow}
                          className={cn(
                            "text-right",
                            category.netFlow.isPos() &&
                              "text-financial-positive",
                            category.netFlow.isNeg() &&
                              "text-financial-negative",
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
