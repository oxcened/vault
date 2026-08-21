"use client";

import { useState } from "react";
import type Decimal from "decimal.js";
import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ArchiveIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Currency,
  RoundedCurrency,
  RoundedNumber,
} from "~/components/ui/number";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { TableSkeleton } from "~/components/table-skeleton";
import { HoldingIcon } from "~/components/holdings/holding-icon";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import { APP_CURRENCY } from "~/constants";
import { cn } from "~/lib/utils";
import { formatNumber } from "~/utils/number";
import { ValueChangePopup } from "./value-change-popup";
import { ValuePopup } from "./value-popup";

export type ValueHistoryRow = {
  timestamp: Date;
  quantity: Decimal;
  quantityId: string | null;
  quantityIsCarried: boolean | null;
  stockPrice?: Decimal | null;
  stockPriceId?: string | null;
  stockPriceIsCarried?: boolean | null;
  fxRate: Decimal | null;
  fxRateId: string | null;
  fxRateIsCarried: boolean | null;
  valueInTarget: Decimal;
};

type Range = "6M" | "1Y" | "ALL";
const chartConfig = {
  value: { label: "Value", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function HoldingDetail({
  holdingCurrency,
  holdingComputedValue,
  holdingName,
  holdingCategory = "Other",
  isLiquid = false,
  isCategoryStock = false,
  isPending,
  latestStockPrice,
  ticker,
  tickerExchange,
  tickerName,
  valueHistory = [],
  type,
  quantity,
  archivedAt,
  onQuantityEdit,
  onQuantityDelete,
  onNewHolding,
  onEditHolding,
}: {
  holdingName?: string;
  holdingCategory?: string;
  isLiquid?: boolean;
  isPending: boolean;
  holdingComputedValue?: Decimal;
  holdingCurrency?: string;
  isCategoryStock?: boolean;
  ticker?: string;
  tickerName?: string;
  tickerExchange?: string;
  latestStockPrice?: Decimal;
  valueHistory?: ValueHistoryRow[];
  type: "asset" | "debt";
  quantity?: Decimal;
  archivedAt?: Date | null;
  onQuantityEdit: (args: { id: string }) => void;
  onQuantityDelete: (args: { timestamp: Date }) => void;
  onNewHolding: () => void;
  onEditHolding: () => void;
}) {
  const [range, setRange] = useState<Range>("1Y");
  const previousValue = valueHistory[1]?.valueInTarget;
  const change =
    holdingComputedValue && previousValue
      ? holdingComputedValue.minus(previousValue)
      : undefined;
  const count = range === "6M" ? 6 : range === "1Y" ? 12 : valueHistory.length;
  const chartData = valueHistory
    .slice(0, count)
    .toReversed()
    .map((item) => ({
      month: format(item.timestamp, "MMM yy"),
      value: item.valueInTarget.toNumber(),
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
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink
                href={`/dashboard/net-worth/${type === "asset" ? "assets" : "debts"}`}
              >
                {type === "asset" ? "Assets" : "Debts"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{holdingName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="mx-auto w-full max-w-screen-lg p-5">
        {isPending ? (
          <TableSkeleton />
        ) : (
          <div className="flex flex-col gap-5">
            <Card
              className={cn(
                "overflow-hidden shadow-none",
                type === "asset"
                  ? "border-blue-500/20 bg-gradient-to-br from-card via-card to-blue-500/10"
                  : "border-rose-500/20 bg-gradient-to-br from-card via-card to-rose-500/10",
              )}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <HoldingIcon category={holdingCategory} type={type} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h1 className="truncate font-semibold">
                          {holdingName}
                        </h1>
                        {archivedAt && (
                          <ArchiveIcon className="size-4 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {holdingCategory} · {holdingCurrency}
                        {type === "asset" && isLiquid ? " · Liquid" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onEditHolding}>
                      <PencilIcon />
                      Edit
                    </Button>
                    <Button onClick={onNewHolding}>
                      <PlusIcon />
                      Add valuation
                    </Button>
                  </div>
                </div>
                <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Current value
                    </p>
                    <p className="text-4xl font-semibold tracking-tight">
                      <RoundedCurrency value={holdingComputedValue} />
                    </p>
                  </div>
                  {change && (
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          change.gt(0)
                            ? "text-financial-positive"
                            : change.lt(0)
                              ? "text-financial-negative"
                              : "text-muted-foreground",
                        )}
                      >
                        <RoundedCurrency
                          value={change}
                          options={{ signDisplay: "always" }}
                        />
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        since previous valuation
                      </p>
                    </div>
                  )}
                </div>
                {(isCategoryStock || quantity) && (
                  <div className="mt-5 flex flex-wrap gap-3 border-t pt-4 text-sm">
                    {quantity && (
                      <Badge variant="secondary">
                        <RoundedNumber value={quantity} />
                        &nbsp;{isCategoryStock ? "shares" : "units"}
                      </Badge>
                    )}
                    {isCategoryStock && latestStockPrice && (
                      <span className="text-muted-foreground">
                        {tickerName ?? ticker} ·{" "}
                        <Currency
                          value={latestStockPrice}
                          options={{
                            currency: holdingCurrency,
                            maximumFractionDigits: 2,
                          }}
                        />
                        {tickerExchange ? ` · ${tickerExchange}` : ""}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {chartData.length > 1 && (
              <Card className="shadow-none">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Value history</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      How this holding has changed over time.
                    </p>
                  </div>
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
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig}
                    className="h-[15rem] w-full"
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
                        dataKey="value"
                        type="linear"
                        stroke="var(--color-value)"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            <section>
              <div className="mb-2">
                <h2 className="text-sm font-medium">Valuation history</h2>
                <p className="text-xs text-muted-foreground">
                  Monthly values and the movement between them.
                </p>
              </div>
              <ValuationHistoryList
                rows={valueHistory}
                onEdit={onQuantityEdit}
                onDelete={onQuantityDelete}
              />
            </section>
          </div>
        )}
      </main>
    </>
  );
}

function ValuationHistoryList({
  rows,
  onEdit,
  onDelete,
}: {
  rows: ValueHistoryRow[];
  onEdit: (args: { id: string }) => void;
  onDelete: (args: { timestamp: Date }) => void;
}) {
  const { confirm, modal } = useConfirmDelete();
  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        {rows.map((row, index) => {
          const previous = rows[index + 1];
          const change = previous
            ? row.valueInTarget.minus(previous.valueInTarget)
            : undefined;
          return (
            <div
              key={row.timestamp.toISOString()}
              className={cn(
                "group relative flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0 sm:px-4 sm:py-3",
                index === 0 && "bg-muted/25",
              )}
            >
              <span
                className={cn(
                  "hidden size-2 shrink-0 rounded-full sm:block",
                  index === 0
                    ? "bg-blue-500 ring-4 ring-blue-500/10"
                    : "bg-border",
                )}
              />
              <button
                type="button"
                className="min-w-0 flex-1 text-left sm:flex sm:items-center sm:gap-3"
                disabled={!row.quantityId || !!row.quantityIsCarried}
                onClick={() => row.quantityId && onEdit({ id: row.quantityId })}
              >
                <span className="block text-sm font-medium sm:w-32">
                  {format(row.timestamp, "MMM yyyy")}
                </span>
                {index === 0 && (
                  <Badge variant="secondary" className="mt-1 sm:mt-0">
                    Latest
                  </Badge>
                )}
              </button>
              <span className="hidden min-w-32 shrink-0 items-center justify-end gap-1 sm:flex">
                {change ? (
                  <>
                    <RoundedCurrency
                      value={change}
                      options={{ signDisplay: "always" }}
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        change.gt(0)
                          ? "bg-emerald-500/10 text-financial-positive"
                          : change.lt(0)
                            ? "bg-rose-500/10 text-financial-negative"
                            : "bg-muted text-muted-foreground",
                      )}
                    />
                    {previous && (
                      <ValueChangePopup row={row} previousRow={previous} />
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Starting value
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right sm:min-w-36">
                <span className="flex items-center justify-end gap-1">
                  <RoundedCurrency
                    value={row.valueInTarget}
                    className="text-sm font-medium"
                  />
                  <ValuePopup row={row} />
                </span>
                {change && (
                  <RoundedCurrency
                    value={change}
                    options={{ signDisplay: "always" }}
                    className={cn(
                      "block text-[11px] sm:hidden",
                      change.gt(0)
                        ? "text-financial-positive"
                        : change.lt(0)
                          ? "text-financial-negative"
                          : "text-muted-foreground",
                    )}
                  />
                )}
              </span>
              {row.quantityId && !row.quantityIsCarried && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEdit({ id: row.quantityId! })}
                    >
                      Edit valuation
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() =>
                        confirm({
                          itemType: "value",
                          itemName: format(row.timestamp, "d MMM yyyy"),
                          onConfirm: () =>
                            onDelete({ timestamp: row.timestamp }),
                        })
                      }
                    >
                      Delete valuation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>
      {modal}
    </>
  );
}
