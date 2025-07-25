"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { api } from "~/trpc/react";
import { Percentage, RoundedCurrency } from "~/components/ui/number";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";

import { formatDate } from "~/utils/date";

import {
  CartesianGrid,
  XAxis,
  Line,
  Bar,
  ComposedChart,
  YAxis,
} from "recharts";
import { calculateZeroInclusiveYAxisDomain } from "~/utils/chart";
import { TableSkeleton } from "~/components/table-skeleton";
import { TrendIndicator } from "~/components/ui/trend-indicator";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";
import { formatNumber } from "~/utils/number";
import { APP_CURRENCY } from "~/constants";

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

export default function NetWorthPage() {
  const { data, isPending } = api.netWorthOverview.get.useQuery();

  const chartData = data?.netWorthHistory.map((nw) => ({
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
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard/net-worth">
                Net worth
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-10 p-5">
        {isPending && <TableSkeleton />}

        {!isPending && (
          <div>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">Net worth</p>
            </div>

            <div className="flex items-end gap-3">
              <p className="text-3xl">
                <RoundedCurrency value={data?.latestNetWorth?.netValue} />
              </p>
              <TrendIndicator value={data?.netWorthTrend} />
            </div>

            <div className="mt-5 flex gap-5">
              <div>
                <p className="text-sm text-muted-foreground">Assets</p>
                <div className="flex items-end gap-3">
                  <p className="text-xl">
                    <RoundedCurrency
                      value={data?.latestNetWorth?.totalAssets}
                    />
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Debts</p>
                <div className="flex items-end gap-3">
                  <p className="text-xl">
                    <RoundedCurrency value={data?.latestNetWorth?.totalDebts} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isPending && !data?.netWorthHistory?.length && (
          <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don&apos;t have a net worth history yet
          </div>
        )}

        {!isPending && !!chartData?.length && (
          <>
            <div>
              <p className="font-medium">Net worth history</p>
              <p className="text-muted-foreground">Last 12 months</p>
            </div>
            <ChartContainer
              config={netWorthChartConfig}
              className="h-[15rem] w-full"
            >
              <ComposedChart accessibilityLayer data={chartData}>
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
                  dataKey="totalAssets"
                  fill="var(--color-totalAssets)"
                  barSize={30}
                  radius={4}
                />

                <Bar
                  dataKey="totalDebts"
                  fill="var(--color-totalDebts)"
                  barSize={30}
                  radius={4}
                />

                <Line
                  dataKey="netWorth"
                  type="monotone"
                  stroke="var(--color-netWorth)"
                  strokeWidth={3}
                  dot={false}
                />
              </ComposedChart>
            </ChartContainer>
          </>
        )}

        {!isPending && !!data?.assetByCategory.length && (
          <>
            <div>
              <p className="font-medium">Asset by category</p>
              <p className="text-muted-foreground">Current month</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Allocation</TableHead>
                  <TableHead className="w-32 text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.assetByCategory.map((category) => (
                  <TableRow key={category.category}>
                    <TableCell>{category.category}</TableCell>
                    <TableCell>
                      <Percentage value={category.percentage} />
                    </TableCell>
                    <TableCell className="text-right">
                      <RoundedCurrency
                        value={category.value}
                        className={cn("text-right")}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </>
  );
}
