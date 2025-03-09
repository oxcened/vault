"use client";

import { api } from "~/trpc/react";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Separator } from "~/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "~/components/ui/breadcrumb";
import { useSession } from "next-auth/react";
import { Percentage, RoundedCurrency } from "~/components/ui/number";
import {
  ChartNoAxesCombined,
  PiggyBank,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatDate } from "~/utils/date";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import {
  CartesianGrid,
  XAxis,
  Line,
  Bar,
  ComposedChart,
  Cell,
  ReferenceLine,
} from "recharts";
import { cn } from "~/lib/utils";
import { TableSkeleton } from "~/components/table-skeleton";
import { TransactionTable } from "~/components/transaction-table";

const chartData = [
  { month: "January", cashFlow: 80 },
  { month: "February", cashFlow: 200 },
  { month: "March", cashFlow: -120 },
  { month: "April", cashFlow: 190 },
  { month: "May", cashFlow: -130 },
  { month: "June", cashFlow: 140 },
].map((i) => ({
  ...i,
  fill:
    i.cashFlow >= 0
      ? "rgb(var(--financial-positive))"
      : "rgb(var(--financial-negative))",
}));

const chartConfig = {
  cashFlow: {
    label: "Cash flow",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const netWorthChartConfig = {
  netWorth: {
    label: "Net worth",
    color: "hsl(var(--chart-1))",
  },
  totalAssets: {
    label: "Assets",
    color: "hsl(var(--chart-2))",
  },
  totalDebts: {
    label: "Debts",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { data, isLoading } = api.dashboard.getSummary.useQuery();
  const { data: session, status } = useSession();

  const netWorthForecast = data?.netWorth.plus(data.cashFlow.mul(12));
  const financialRunwayMonths = data?.totalAssets
    .div(data.totalExpenses)
    .toFixed(0);
  const netWorthChartData = data?.netWorthHistory.map((nw) => ({
    month: formatDate({
      date: nw.timestamp,
      options: {
        dateStyle: undefined,
        month: "short",
      },
    }),
    netWorth: nw.netValue.toNumber(),
    totalAssets: nw.totalAssets.toNumber(),
    totalDebts: nw.totalDebts.toNumber(),
  }));

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {(isLoading || status === "loading") && (
        <div className="mx-auto w-full max-w-screen-md p-5">
          <TableSkeleton />
        </div>
      )}

      {!isLoading && status !== "loading" && !data && (
        <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
          You don't have enough data yet
        </div>
      )}

      {!isLoading && status !== "loading" && data && (
        <>
          <div className="mx-auto w-full max-w-screen-md p-5">
            <p className="text-3xl">Hey, {session!.user.name}</p>

            <div className="mt-10 flex flex-col gap-16">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground">Net worth</p>
                  </div>

                  <div className="flex items-end gap-3">
                    <p className="text-3xl">
                      <RoundedCurrency value={data.netWorth} />
                    </p>
                    {data.netWorthTrend?.eq(0) === false && (
                      <div
                        className={cn(
                          "flex items-center gap-1 self-center rounded-lg text-sm",
                          data.netWorthTrend.gt(0)
                            ? "text-financial-positive"
                            : "text-financial-negative",
                        )}
                      >
                        {data.netWorthTrend.gt(0) ? (
                          <TrendingUp className="size-4" />
                        ) : (
                          <TrendingDown className="size-4" />
                        )}
                        <p>
                          <Percentage value={data.netWorthTrend} /> this month
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex gap-5">
                    <div>
                      <p className="text-sm text-muted-foreground">Assets</p>
                      <div className="flex items-end gap-3">
                        <p className="text-xl">
                          <RoundedCurrency value={data.totalAssets} />
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Debts</p>
                      <div className="flex items-end gap-3">
                        <p className="text-xl">
                          <RoundedCurrency value={data.totalDebts} />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground">Cash flow</p>
                  </div>
                  <div className="flex items-end gap-3">
                    <p className="text-3xl">
                      <RoundedCurrency value={data.cashFlow} />
                    </p>
                    <div className="flex items-center gap-1 self-center rounded-lg text-sm text-financial-negative">
                      {-1 > 0 ? (
                        <TrendingUp className="size-4" />
                      ) : (
                        <TrendingDown className="size-4" />
                      )}
                      <p>
                        <Percentage value={-1} /> this month
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-5">
                    <div>
                      <p className="text-sm text-muted-foreground">Income</p>
                      <div className="flex items-end gap-3">
                        <p className="text-xl">
                          <RoundedCurrency value={data.totalIncome} />
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Expenses</p>
                      <div className="flex items-end gap-3">
                        <p className="text-xl">
                          <RoundedCurrency value={data.totalExpenses} />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
                <ChartContainer config={netWorthChartConfig}>
                  <ComposedChart accessibilityLayer data={netWorthChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />

                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />

                    <Bar
                      yAxisId="right"
                      dataKey="totalAssets"
                      fill="var(--color-totalAssets)"
                      barSize={30}
                      radius={4}
                      opacity={0.8}
                    />

                    <Bar
                      yAxisId="right"
                      dataKey="totalDebts"
                      fill="var(--color-totalDebts)"
                      barSize={30}
                      radius={4}
                      opacity={0.8}
                    />

                    <Line
                      yAxisId="left"
                      dataKey="netWorth"
                      type="monotone"
                      stroke="var(--color-netWorth)"
                      strokeWidth={3}
                      dot={false}
                    />
                  </ComposedChart>
                </ChartContainer>

                <ChartContainer config={chartConfig}>
                  <ComposedChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />

                    <Bar
                      yAxisId="right"
                      dataKey="cashFlow"
                      barSize={30}
                      radius={4}
                      opacity={0.8}
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.month}
                          fill={
                            entry.cashFlow >= 0
                              ? "rgb(var(--financial-positive))"
                              : "rgb(var(--financial-negative))"
                          }
                        />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ChartContainer>
              </div>

              <div className="flex flex-col gap-10">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-muted p-2">
                    <ChartNoAxesCombined />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Net worth forecast
                    </p>
                    <p>
                      At your current cash flow trend, your net worth could grow
                      to <RoundedCurrency value={netWorthForecast} /> in a year.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-muted p-2">
                    <PiggyBank />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Financial runway
                    </p>
                    <p>
                      At your current spending rate, your assets could sustain
                      you for {financialRunwayMonths} months.
                    </p>
                  </div>
                </div>
              </div>

              <TransactionTable showSeeAllLink data={data.recentTransactions} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
