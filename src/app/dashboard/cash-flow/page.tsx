"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { type Prisma } from "@prisma/client";
import { ArrowRight, ArrowUpDown, ChartNoAxesColumn, List } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
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
import { HistoryDot } from "~/components/ui/history-dot";
import { MonthPicker } from "~/components/ui/month-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  getTransactionAccent,
  TransactionIcon,
} from "~/components/transactionTable/transaction-icon";
import { APP_CURRENCY } from "~/constants";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { toMonthTimestamp } from "~/utils/date";
import { formatNumber } from "~/utils/number";

type Overview = RouterOutputs["cashFlow"]["getMonthlyCashFlow"];
type Range = "6M" | "1Y" | "ALL";
type HistoryView = "CHART" | "LIST";
type CategoryType = "INCOME" | "EXPENSE";

const chartConfig = {
  cashFlow: { label: "Cash flow", color: "var(--chart-3)" },
  income: { label: "Income", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function CashFlowPage() {
  const [categoryDate, setCategoryDate] = useState(() =>
    toMonthTimestamp(new Date()),
  );
  const { data, isPending } = api.cashFlow.getMonthlyCashFlow.useQuery(
    { categoryDate },
    { placeholderData: (previousData) => previousData },
  );

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DashboardBreadcrumb items={[{ label: "Cash flow" }]} />
      </header>

      <main className="mx-auto flex w-full max-w-screen-lg flex-col gap-5 p-5">
        {isPending ? (
          <PageSkeleton />
        ) : data?.latestCashFlow ? (
          <>
            <SummaryCard data={data} />
            <HistoryCard data={data} />
            <CategoryCard
              data={data}
              date={categoryDate}
              onDateChange={setCategoryDate}
            />
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
            type="INCOME"
            month={latest.timestamp}
          />
          <MetricLink
            label="Expenses"
            value={latest.expenses}
            color="bg-rose-500"
            type="EXPENSE"
            month={latest.timestamp}
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
  type,
  month,
}: {
  label: string;
  value: Prisma.Decimal;
  color: string;
  type: CategoryType;
  month: Date;
}) {
  return (
    <Link
      href={`/dashboard/transactions?type=${type}&month=${format(month, "yyyy-MM")}`}
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
  const [view, setView] = useState<HistoryView>("CHART");
  const [showIncome, setShowIncome] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const count =
    range === "6M" ? 6 : range === "1Y" ? 12 : data.cashFlowByMonth.length;
  const visibleHistory = data.cashFlowByMonth.slice(-count);
  const chartData = visibleHistory.map((item) => ({
    month: format(item.timestamp, "MMM yy"),
    cashFlow: item.netFlow.toNumber(),
    income: item.income.toNumber(),
    expenses: item.expenses.toNumber(),
  }));

  return (
    <Tabs value={view} onValueChange={(value) => setView(value as HistoryView)}>
      <Card className="shadow-none">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Cash flow history</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              See how much you kept each month.
            </p>
          </div>
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:flex-wrap">
            <TabsList className="h-8 w-full sm:order-last sm:w-auto">
              <TabsTrigger
                value="CHART"
                className="h-7 flex-1 gap-1.5 px-2.5 sm:flex-none"
              >
                <ChartNoAxesColumn className="size-3.5" />
                Chart
              </TabsTrigger>
              <TabsTrigger
                value="LIST"
                className="h-7 flex-1 gap-1.5 px-2.5 sm:flex-none"
              >
                <List className="size-3.5" />
                List
              </TabsTrigger>
            </TabsList>
            <div className="flex rounded-md border p-0.5 sm:ml-auto">
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
            {view === "CHART" && (
              <div className="col-span-2 grid grid-cols-2 gap-2 sm:order-first sm:flex">
                <Button
                  variant={showIncome ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowIncome((value) => !value)}
                >
                  <span className="size-2 rounded-full bg-[var(--chart-1)]" />
                  Income
                </Button>
                <Button
                  variant={showExpenses ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowExpenses((value) => !value)}
                >
                  <span className="size-2 rounded-full bg-[var(--chart-2)]" />
                  Expenses
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TabsContent value="CHART" className="mt-0">
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
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
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
          </TabsContent>
          <TabsContent value="LIST" className="mt-0">
            <CashFlowHistoryList data={[...visibleHistory].reverse()} />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}

function CashFlowHistoryList({ data }: { data: Overview["cashFlowByMonth"] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      {data.map((snapshot, index) => {
        const savingRate = snapshot.income.eq(0)
          ? undefined
          : snapshot.netFlow.div(snapshot.income);

        return (
          <div
            key={snapshot.id}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b px-4 py-2 last:border-b-0 md:grid-cols-[minmax(9rem,1fr)_1fr_1fr_1fr_1fr]",
              index === 0 && "bg-emerald-500/[0.04]",
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <HistoryDot latest={index === 0} accent="emerald" />
              <span className="text-sm font-medium">
                {format(snapshot.timestamp, "MMM yyyy")}
              </span>
              {index === 0 && (
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  Latest
                </span>
              )}
            </div>
            <CashFlowHistoryMetric
              label="Income"
              value={<RoundedCurrency value={snapshot.income} />}
            />
            <CashFlowHistoryMetric
              label="Expenses"
              value={<RoundedCurrency value={snapshot.expenses} />}
            />
            <CashFlowHistoryMetric
              label="Saving rate"
              value={
                savingRate ? (
                  <Percentage value={savingRate} />
                ) : (
                  <span className="text-muted-foreground">–</span>
                )
              }
            />
            <div className="text-right">
              <RoundedCurrency
                value={snapshot.netFlow}
                className={cn(
                  "text-sm",
                  snapshot.netFlow.gt(0) && "text-financial-positive",
                  snapshot.netFlow.lt(0) && "text-financial-negative",
                )}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CashFlowHistoryMetric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="hidden md:block">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}

function CategoryCard({
  data,
  date,
  onDateChange,
}: {
  data: Overview;
  date: Date;
  onDateChange: (date: Date) => void;
}) {
  const [type, setType] = useState<CategoryType>("EXPENSE");
  const amountKey = type === "INCOME" ? "income" : "expenses";
  const items = data.cashFlowByCategory.filter((item) => item[amountKey].gt(0));
  const total = items.reduce(
    (sum, item) => sum + item[amountKey].toNumber(),
    0,
  );

  return (
    <Card className="shadow-none">
      <CardHeader className="gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>By category</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            <RoundedCurrency value={total} /> total{" "}
            {type === "INCOME" ? "income" : "expenses"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <MonthPicker
            value={date}
            maxMonth={new Date()}
            className="col-span-2 h-8 w-full sm:w-auto"
            onChange={onDateChange}
          />
          <div className="col-span-2 grid grid-cols-2 rounded-md border p-0.5 sm:flex">
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
        </div>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {items.map((item) => {
              const percentage = Math.min(
                100,
                total === 0 ? 0 : (item[amountKey].toNumber() / total) * 100,
              );
              const accent = getTransactionAccent({
                category: item.category,
                type,
              });
              return (
                <Link
                  key={item.categoryId}
                  href={`/dashboard/transactions?type=${type}&month=${format(date, "yyyy-MM")}&categoryId=${item.categoryId}`}
                  className="group relative overflow-hidden rounded-xl border bg-muted/15 transition-colors hover:bg-muted/25"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 transition-[width] duration-500"
                    style={{
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 18%, transparent), color-mix(in srgb, ${accent} 9%, transparent))`,
                    }}
                  />
                  <div className="relative flex items-center gap-3 px-3 py-2.5">
                    <TransactionIcon category={item.category} type={type} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {item.category}
                    </span>
                    <div className="flex shrink-0 items-baseline gap-2">
                      <RoundedCurrency
                        value={item[amountKey]}
                        className={cn(
                          "text-sm",
                          type === "INCOME"
                            ? "text-financial-positive"
                            : "text-financial-negative",
                        )}
                      />
                      <Percentage
                        value={percentage / 100}
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
