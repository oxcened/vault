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
  TableFooter,
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
  BarChart,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts";
import { calculateZeroInclusiveYAxisDomain } from "~/utils/chart";
import { formatDate } from "~/utils/date";
import { TrendIndicator } from "~/components/ui/trend-indicator";

const cashFlowByMonthConfig = {
  cashFlow: {
    label: "Cash flow",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const cashFlowByCategoryConfig = {
  cashFlow: {
    label: "Cash flow",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function CashFlowPage() {
  const { data, isLoading } = api.cashFlow.getMonthlyCashFlow.useQuery();

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
      fill: item?.netFlow.gte(0)
        ? "rgb(var(--financial-positive))"
        : "rgb(var(--financial-negative))",
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
              <BreadcrumbLink href="/dashboard/net-worth">
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

      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-10 p-5">
        {isLoading && <TableSkeleton />}

        {!isLoading && (
          <div>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">Cash flow</p>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl">
                <RoundedCurrency value={data?.latestCashFlow?.netFlow} />
              </p>
              <TrendIndicator value={data?.cashFlowTrend} />
            </div>

            <div className="mt-5 flex gap-5">
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <div className="flex items-end gap-3">
                  <p className="text-xl">
                    <RoundedCurrency value={data?.latestCashFlow?.income} />
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <div className="flex items-end gap-3">
                  <p className="text-xl">
                    <RoundedCurrency value={data?.latestCashFlow?.expenses} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !cashFlowByMonthData?.length && (
          <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don't have a cash flow history yet
          </div>
        )}

        {!isLoading && !!cashFlowByMonthData?.length && (
          <>
            <div>
              <p className="font-medium">Cash flow history</p>
              <p className="text-muted-foreground">Last 12 months</p>
            </div>
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
                  tickFormatter={(value) => value.slice(0, 3)}
                />

                <YAxis
                  dataKey="cashFlow"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={calculateZeroInclusiveYAxisDomain}
                />

                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />

                <Bar dataKey="cashFlow" barSize={30} radius={4} />
              </ComposedChart>
            </ChartContainer>
          </>
        )}

        {!isLoading && !cashFlowByCategoryData?.length && (
          <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don't have a cash flow this month yet
          </div>
        )}

        {!isLoading && !!cashFlowByCategoryData?.length && (
          <>
            <div>
              <p className="font-medium">Cash flow by category</p>
              <p className="text-muted-foreground">Current month</p>
            </div>
            <ChartContainer
              config={cashFlowByCategoryConfig}
              className="h-[15rem] w-full"
            >
              <BarChart accessibilityLayer data={cashFlowByCategoryData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                />
                <YAxis
                  dataKey="cashFlow"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={calculateZeroInclusiveYAxisDomain}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="cashFlow"
                  fill="var(--color-cashFlow)"
                  barSize={30}
                  radius={4}
                />
              </BarChart>
            </ChartContainer>

            <div>
              <p className="font-medium">Cash flow by category</p>
              <p className="text-muted-foreground">Current month</p>
            </div>
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
                          category.netFlow.isPos() && "text-financial-positive",
                          category.netFlow.isNeg() && "text-financial-negative",
                        )}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total income</TableCell>
                  <TableCell className="text-right">
                    <Currency value={data?.latestCashFlow?.income} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total expenses</TableCell>
                  <TableCell className="text-right">
                    <Currency value={data?.latestCashFlow?.expenses} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cash flow</TableCell>
                  <TableCell className="text-right">
                    <Currency value={data?.latestCashFlow?.netFlow} />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </>
        )}
      </div>
    </>
  );
}
