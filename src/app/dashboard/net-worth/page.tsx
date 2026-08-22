"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { type Prisma } from "@prisma/client";
import {
  ArrowRight,
  ChartNoAxesColumn,
  Landmark,
  List,
  WalletCards,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import {
  getHoldingAccent,
  HoldingIcon,
} from "~/components/holdings/holding-icon";
import { Percentage, RoundedCurrency } from "~/components/ui/number";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Skeleton } from "~/components/ui/skeleton";
import { HistoryDot } from "~/components/ui/history-dot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { APP_CURRENCY } from "~/constants";
import { formatNumber } from "~/utils/number";

type Overview = RouterOutputs["netWorthOverview"]["get"];
type Range = "6M" | "1Y" | "ALL";
type HistoryView = "CHART" | "LIST";
type AllocationType = "asset" | "debt";

const chartConfig = {
  netWorth: { label: "Net worth", color: "var(--chart-3)" },
  totalAssets: { label: "Assets", color: "var(--chart-1)" },
  totalDebts: { label: "Debts", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function NetWorthPage() {
  const { data, isPending } = api.netWorthOverview.get.useQuery();

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DashboardBreadcrumb items={[{ label: "Net worth" }]} />
      </header>

      <main className="mx-auto flex w-full min-w-0 max-w-screen-lg flex-col gap-5 p-5">
        {isPending ? (
          <PageSkeleton />
        ) : data?.latestNetWorth ? (
          <>
            <SnapshotCard data={data} />
            <HistoryCard data={data} />
            <div className="grid gap-5 lg:grid-cols-2">
              <AllocationCard data={data} />
              <ChangesCard data={data} />
            </div>
          </>
        ) : (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            You don&apos;t have a net worth history yet
          </div>
        )}
      </main>
    </>
  );
}

function SnapshotCard({ data }: { data: Overview }) {
  const latest = data.latestNetWorth!;
  const assets = latest.totalAssets.abs();
  const debts = latest.totalDebts.abs();
  const total = assets.plus(debts);
  const assetShare = total.eq(0) ? 0 : assets.div(total).times(100).toNumber();
  const asOfDate =
    latest.timestamp > new Date() ? new Date() : latest.timestamp;

  return (
    <Card className="overflow-hidden border-blue-500/20 bg-gradient-to-br from-card via-card to-blue-500/10 shadow-none">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-500">
              <WalletCards className="size-5" />
            </span>
            <div>
              <h1 className="font-semibold">Net worth</h1>
              <p className="text-xs text-muted-foreground">
                As of {format(asOfDate, "d MMMM yyyy")}
              </p>
            </div>
          </div>
          {data.previousNetWorth && data.netWorthChange && (
            <div className="text-right">
              <p
                className={cn(
                  "text-sm font-medium",
                  data.netWorthChange.gte(0)
                    ? "text-financial-positive"
                    : "text-financial-negative",
                )}
              >
                <RoundedCurrency
                  value={data.netWorthChange}
                  options={{ signDisplay: "always" }}
                />
                {data.netWorthTrend && (
                  <span className="ml-1">
                    (
                    <Percentage
                      value={data.netWorthTrend}
                      options={{ signDisplay: "always" }}
                    />
                    )
                  </span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">
                since {format(data.previousNetWorth.timestamp, "d MMM yyyy")}
              </p>
            </div>
          )}
        </div>
        <p className="mt-7 text-4xl font-semibold tracking-tight">
          <RoundedCurrency value={latest.netValue} />
        </p>
        <div className="mt-6 flex h-1.5 overflow-hidden rounded-full bg-rose-500/70">
          <span className="bg-blue-500" style={{ width: `${assetShare}%` }} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SnapshotLink
            href="/dashboard/assets"
            label="Assets"
            value={latest.totalAssets}
            color="bg-blue-500"
          />
          <SnapshotLink
            href="/dashboard/debts"
            label="Debts"
            value={latest.totalDebts}
            color="bg-rose-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SnapshotLink({
  href,
  label,
  value,
  color,
}: {
  href: string;
  label: string;
  value: Prisma.Decimal;
  color: string;
}) {
  return (
    <Link
      href={href}
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
  const [showAssets, setShowAssets] = useState(false);
  const [showDebts, setShowDebts] = useState(false);
  const count =
    range === "6M" ? 6 : range === "1Y" ? 12 : data.netWorthHistory.length;
  const visibleHistory = data.netWorthHistory.slice(-count);
  const chartData = visibleHistory.map((item) => ({
    month: format(item.timestamp, "MMM yy"),
    netWorth: item.netValue.toNumber(),
    totalAssets: item.totalAssets.toNumber(),
    totalDebts: item.totalDebts.toNumber(),
  }));

  return (
    <Tabs
      value={view}
      onValueChange={(value) => setView(value as HistoryView)}
      className="min-w-0 max-w-full"
    >
      <Card className="min-w-0 overflow-hidden shadow-none">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Net worth history</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Track the direction, without losing the underlying totals.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {view === "CHART" && (
              <>
                <Button
                  variant={showAssets ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowAssets((value) => !value)}
                >
                  Assets
                </Button>
                <Button
                  variant={showDebts ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowDebts((value) => !value)}
                >
                  Debts
                </Button>
              </>
            )}
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
            <TabsList className="h-8">
              <TabsTrigger value="CHART" className="h-7 gap-1.5 px-2.5">
                <ChartNoAxesColumn className="size-3.5" />
                Chart
              </TabsTrigger>
              <TabsTrigger value="LIST" className="h-7 gap-1.5 px-2.5">
                <List className="size-3.5" />
                List
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className="min-w-0">
          <TabsContent value="CHART" className="mt-0">
            <ChartContainer
              config={chartConfig}
              className="h-[17rem] min-w-0 max-w-full"
            >
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
                  dataKey="netWorth"
                  type="linear"
                  stroke="var(--color-netWorth)"
                  strokeWidth={3}
                  dot={false}
                />
                {showAssets && (
                  <Line
                    dataKey="totalAssets"
                    type="linear"
                    stroke="var(--color-totalAssets)"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
                {showDebts && (
                  <Line
                    dataKey="totalDebts"
                    type="linear"
                    stroke="var(--color-totalDebts)"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </LineChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="LIST" className="mt-0">
            <HistoryList data={[...visibleHistory].reverse()} />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}

function HistoryList({ data }: { data: Overview["netWorthHistory"] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      {data.map((snapshot, index) => {
        const previous = data[index + 1];
        const change = previous
          ? snapshot.netValue.minus(previous.netValue)
          : undefined;

        return (
          <div
            key={snapshot.id}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b px-4 py-2 last:border-b-0 md:grid-cols-[minmax(9rem,1fr)_1fr_1fr_1fr_1fr]",
              index === 0 && "bg-blue-500/[0.04]",
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <HistoryDot latest={index === 0} accent="blue" />
              <span className="text-sm font-medium">
                {format(snapshot.timestamp, "MMM yyyy")}
              </span>
              {index === 0 && (
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  Latest
                </span>
              )}
            </div>
            <HistoryMetric
              label="Assets"
              value={<RoundedCurrency value={snapshot.totalAssets} />}
            />
            <HistoryMetric
              label="Debts"
              value={<RoundedCurrency value={snapshot.totalDebts} />}
            />
            <HistoryMetric
              label="Change"
              value={
                change ? (
                  <RoundedCurrency
                    value={change}
                    options={{ signDisplay: "always" }}
                    className={cn(
                      change.gte(0)
                        ? "text-financial-positive"
                        : "text-financial-negative",
                    )}
                  />
                ) : (
                  <span className="text-muted-foreground">Starting value</span>
                )
              }
            />
            <div className="text-right">
              <RoundedCurrency value={snapshot.netValue} className="text-sm" />
              {change && (
                <RoundedCurrency
                  value={change}
                  options={{ signDisplay: "always" }}
                  className={cn(
                    "block text-xs md:hidden",
                    change.gte(0)
                      ? "text-financial-positive"
                      : "text-financial-negative",
                  )}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HistoryMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="hidden md:block">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}

function AllocationCard({ data }: { data: Overview }) {
  const [type, setType] = useState<AllocationType>("asset");
  const items = type === "asset" ? data.assetByCategory : data.debtByCategory;
  return (
    <Card className="min-w-0 overflow-hidden shadow-none">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle>Allocation</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            As of {format(data.latestNetWorth!.timestamp, "d MMM yyyy")}
          </p>
        </div>
        <div className="flex shrink-0 rounded-md border p-0.5">
          {(["asset", "debt"] as const).map((option) => (
            <Button
              key={option}
              variant={type === option ? "secondary" : "ghost"}
              size="sm"
              className="h-7 capitalize"
              onClick={() => setType(option)}
            >
              {option}s
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        {items.length ? (
          <div className="space-y-2">
            {items.map((item) => {
              const percentage = Math.min(
                100,
                item.percentage.times(100).toNumber(),
              );
              const accent = getHoldingAccent(item.category, type);

              return (
                <div
                  key={item.category}
                  className="relative min-w-0 overflow-hidden rounded-xl border bg-muted/15"
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
                    <HoldingIcon category={item.category} type={type} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {item.category}
                    </span>
                    <div className="grid max-w-[55%] shrink-0 grid-cols-[minmax(0,auto)_2.25rem] items-baseline gap-1.5">
                      <RoundedCurrency
                        value={item.value}
                        className="overflow-hidden text-ellipsis whitespace-nowrap text-right text-sm"
                      />
                      <Percentage
                        value={item.percentage}
                        className="w-9 text-right text-[11px] text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {type}s in this snapshot
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ChangesCard({ data }: { data: Overview }) {
  return (
    <Card className="min-w-0 overflow-hidden shadow-none">
      <CardHeader>
        <CardTitle>What changed</CardTitle>
        <p className="text-xs text-muted-foreground">
          {data.previousNetWorth
            ? `Since ${format(data.previousNetWorth.timestamp, "d MMM yyyy")}`
            : "A comparison appears after your next snapshot"}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {data.holdingChanges.length ? (
          <div className="divide-y">
            {data.holdingChanges.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                href={`/dashboard/${item.kind === "asset" ? "assets" : "debts"}/${item.id}`}
                className="flex min-w-0 items-center gap-3 overflow-hidden px-4 py-3 transition-colors hover:bg-muted/40 sm:px-6"
              >
                <HoldingIcon category={item.category} type={item.kind} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.category}
                  </span>
                </span>
                <RoundedCurrency
                  value={item.change}
                  options={{ signDisplay: "always" }}
                  className={cn(
                    "max-w-[45%] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-right text-sm font-medium",
                    item.change.gt(0)
                      ? "text-financial-positive"
                      : "text-financial-negative",
                  )}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center text-sm text-muted-foreground">
            <Landmark className="mb-3 size-6" />
            <p>No holding changes to show</p>
          </div>
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
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
