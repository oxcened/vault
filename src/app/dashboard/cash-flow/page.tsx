"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { type Prisma } from "@prisma/client";
import { ArrowRight, ArrowUpDown } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { Percentage, RoundedCurrency } from "~/components/ui/number";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Skeleton } from "~/components/ui/skeleton";
import { TransactionIcon } from "~/components/transactionTable/transaction-icon";
import { APP_CURRENCY } from "~/constants";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { formatNumber } from "~/utils/number";

type Overview = RouterOutputs["cashFlow"]["getMonthlyCashFlow"];
type Range = "6M" | "1Y" | "ALL";
type CategoryType = "INCOME" | "EXPENSE";

const chartConfig = {
  cashFlow: { label: "Cash flow", color: "var(--chart-3)" },
  income: { label: "Income", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function CashFlowPage() {
  const { data, isPending } = api.cashFlow.getMonthlyCashFlow.useQuery();

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

      <main className="mx-auto flex w-full max-w-screen-lg flex-col gap-5 p-5">
        {isPending ? (
          <PageSkeleton />
        ) : data?.latestCashFlow ? (
          <>
            <SummaryCard data={data} />
            <HistoryCard data={data} />
            <CategoryCard data={data} />
          </>
        ) : (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            You don&apos;t have a cash flow history yet
          </div>
        )}
      </main>
    </>
  );
}

function SummaryCard({ data }: { data: Overview }) {
  const latest = data.latestCashFlow!;
  const total = latest.income.plus(latest.expenses);
  const incomeShare = total.eq(0)
    ? 0
    : latest.income.div(total).times(100).toNumber();
  const savingRate = latest.income.eq(0)
    ? undefined
    : latest.netFlow.div(latest.income);

  return (
    <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-card via-card to-emerald-500/10 shadow-none">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
              <ArrowUpDown className="size-5" />
            </span>
            <div>
              <h1 className="font-semibold">Cash flow</h1>
              <p className="text-xs text-muted-foreground">
                {format(latest.timestamp, "MMMM yyyy")}
              </p>
            </div>
          </div>
          {data.previousCashFlow && data.cashFlowChange && (
            <div className="text-right">
              <p
                className={cn(
                  "text-sm font-medium",
                  data.cashFlowChange.gte(0)
                    ? "text-financial-positive"
                    : "text-financial-negative",
                )}
              >
                <RoundedCurrency
                  value={data.cashFlowChange}
                  options={{ signDisplay: "always" }}
                />
                {data.cashFlowTrend && (
                  <span className="ml-1">
                    (
                    <Percentage
                      value={data.cashFlowTrend}
                      options={{ signDisplay: "always" }}
                    />
                    )
                  </span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">
                vs {format(data.previousCashFlow.timestamp, "MMMM yyyy")}
              </p>
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
          <p
            className={cn(
              "text-4xl font-semibold tracking-tight",
              latest.netFlow.gt(0) && "text-financial-positive",
              latest.netFlow.lt(0) && "text-financial-negative",
            )}
          >
            <RoundedCurrency value={latest.netFlow} />
          </p>
          {savingRate && (
            <p className="text-sm text-muted-foreground">
              <Percentage
                value={savingRate}
                className="font-medium text-foreground"
              />{" "}
              saved
            </p>
          )}
        </div>

        <div className="mt-6 flex h-1.5 overflow-hidden rounded-full bg-rose-500/70">
          <span
            className="bg-emerald-500"
            style={{ width: `${incomeShare}%` }}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MetricLink
            label="Income"
            value={latest.income}
            color="bg-emerald-500"
          />
          <MetricLink
            label="Expenses"
            value={latest.expenses}
            color="bg-rose-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricLink({
  label,
  value,
  color,
}: {
  label: string;
  value: Prisma.Decimal;
  color: string;
}) {
  return (
    <Link
      href="/dashboard/cash-flow/transactions"
      className="group flex items-center rounded-lg border bg-background/40 p-3 transition-colors hover:bg-muted/50"
    >
      <span className={cn("mr-2 size-2 rounded-full", color)} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <RoundedCurrency value={value} className="ml-auto text-sm font-medium" />
      <ArrowRight className="ml-2 size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function HistoryCard({ data }: { data: Overview }) {
  const [range, setRange] = useState<Range>("1Y");
  const [showIncome, setShowIncome] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const count =
    range === "6M" ? 6 : range === "1Y" ? 12 : data.cashFlowByMonth.length;
  const chartData = data.cashFlowByMonth.slice(-count).map((item) => ({
    month: format(item.timestamp, "MMM yy"),
    cashFlow: item.netFlow.toNumber(),
    income: item.income.toNumber(),
    expenses: item.expenses.toNumber(),
  }));

  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Cash flow history</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            See how much you kept each month.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={showIncome ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowIncome((value) => !value)}
          >
            Income
          </Button>
          <Button
            variant={showExpenses ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowExpenses((value) => !value)}
          >
            Expenses
          </Button>
          <div className="flex rounded-md border p-0.5">
            {(["6M", "1Y", "ALL"] as const).map((option) => (
              <Button
                key={option}
                variant={range === option ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5"
                onClick={() => setRange(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[17rem] w-full">
          <LineChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={68}
              tickFormatter={(value: number) =>
                formatNumber({
                  value,
                  options: {
                    style: "currency",
                    currency: APP_CURRENCY,
                    maximumFractionDigits: 0,
                    notation: "compact",
                  },
                })
              }
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="cashFlow"
              type="linear"
              stroke="var(--color-cashFlow)"
              strokeWidth={3}
              dot={false}
            />
            {showIncome && (
              <Line
                dataKey="income"
                type="linear"
                stroke="var(--color-income)"
                strokeWidth={2}
                dot={false}
              />
            )}
            {showExpenses && (
              <Line
                dataKey="expenses"
                type="linear"
                stroke="var(--color-expenses)"
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function CategoryCard({ data }: { data: Overview }) {
  const [type, setType] = useState<CategoryType>("EXPENSE");
  const amountKey = type === "INCOME" ? "income" : "expenses";
  const items = data.cashFlowByCategory.filter((item) => item[amountKey].gt(0));
  const total = items.reduce(
    (sum, item) => sum + item[amountKey].toNumber(),
    0,
  );

  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>By category</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {format(data.latestCashFlow!.timestamp, "MMMM yyyy")}
          </p>
        </div>
        <div className="flex rounded-md border p-0.5">
          {(["EXPENSE", "INCOME"] as const).map((option) => (
            <Button
              key={option}
              variant={type === option ? "secondary" : "ghost"}
              size="sm"
              className="h-7 capitalize"
              onClick={() => setType(option)}
            >
              {option.toLowerCase()}s
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            {items.map((item) => {
              const percentage =
                total === 0 ? 0 : item[amountKey].toNumber() / total;
              return (
                <Link
                  key={item.category}
                  href="/dashboard/cash-flow/transactions"
                  className="group flex items-center gap-3 rounded-lg transition-colors"
                >
                  <TransactionIcon category={item.category} type={type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium">
                        {item.category}
                      </span>
                      <RoundedCurrency
                        value={item[amountKey]}
                        className={cn(
                          "shrink-0",
                          type === "INCOME"
                            ? "text-financial-positive"
                            : "text-financial-negative",
                        )}
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            type === "INCOME"
                              ? "bg-emerald-500"
                              : "bg-rose-500",
                          )}
                          style={{ width: `${percentage * 100}%` }}
                        />
                      </div>
                      <Percentage
                        value={percentage}
                        className="w-9 text-right text-[11px] text-muted-foreground"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {type.toLowerCase()} this month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
