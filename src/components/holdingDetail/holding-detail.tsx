"use client";

import { useEffect, useRef, useState } from "react";
import type Decimal from "decimal.js";
import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ArchiveIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
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
  DropdownMenuSeparator,
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
import { HistoryDot } from "~/components/ui/history-dot";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import { APP_CURRENCY } from "~/constants";
import { cn } from "~/lib/utils";
import { formatDate } from "~/utils/date";
import { formatNumber } from "~/utils/number";
import { ValueChangePopup } from "./value-change-popup";
import { ValuePopup } from "./value-popup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

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
  nextValueHistoryRow,
  hasMoreValueHistory = false,
  isFetchingMoreValueHistory = false,
  type,
  quantity,
  archivedAt,
  onQuantityEdit,
  onQuantityDelete,
  onNewHolding,
  onEditHolding,
  onArchiveHolding,
  onDeleteHolding,
  onLoadMoreValueHistory,
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
  nextValueHistoryRow?: ValueHistoryRow;
  hasMoreValueHistory?: boolean;
  isFetchingMoreValueHistory?: boolean;
  type: "asset" | "debt";
  quantity?: Decimal;
  archivedAt?: Date | null;
  onQuantityEdit: (args: { id: string }) => void;
  onQuantityDelete: (args: { timestamp: Date }) => void;
  onNewHolding: () => void;
  onEditHolding: () => void;
  onArchiveHolding: () => void;
  onDeleteHolding: () => void;
  onLoadMoreValueHistory: () => void;
}) {
  const [range, setRange] = useState<Range>("1Y");
  const [isArchiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const { confirm: confirmHoldingDelete, modal: holdingDeleteModal } =
    useConfirmDelete();
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
        <DashboardBreadcrumb
          items={[
            {
              label: type === "asset" ? "Assets" : "Debts",
              href: `/dashboard/${type === "asset" ? "assets" : "debts"}`,
            },
            ...(archivedAt
              ? [
                  {
                    label: "Archived",
                    href: `/dashboard/${type === "asset" ? "assets" : "debts"}/archived`,
                  },
                ]
              : []),
            { label: holdingName ?? (type === "asset" ? "Asset" : "Debt") },
          ]}
        />
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
                      {archivedAt && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Archived{" "}
                          {formatDate({
                            date: archivedAt,
                            options: {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onEditHolding}>
                      <PencilIcon />
                      Edit
                    </Button>
                    {!archivedAt && (
                      <Button onClick={onNewHolding}>
                        <PlusIcon />
                        Add valuation
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreHorizontalIcon />
                          <span className="sr-only">Holding actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            archivedAt
                              ? onArchiveHolding()
                              : setArchiveDialogOpen(true)
                          }
                        >
                          {archivedAt
                            ? "Restore"
                            : quantity && !quantity.eq(0)
                              ? "Change to zero and archive"
                              : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            confirmHoldingDelete({
                              itemType: type,
                              itemName: holdingName,
                              onConfirm: onDeleteHolding,
                            })
                          }
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                {isCategoryStock && (
                  <div className="mt-5 flex flex-wrap gap-3 border-t pt-4 text-sm">
                    {quantity && (
                      <Badge variant="secondary" className="gap-1">
                        <RoundedNumber value={quantity} />
                        <span>shares</span>
                      </Badge>
                    )}
                    {latestStockPrice && (
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
                readOnly={!!archivedAt}
                nextRow={nextValueHistoryRow}
                hasMore={hasMoreValueHistory}
                isFetchingMore={isFetchingMoreValueHistory}
                onLoadMore={onLoadMoreValueHistory}
                onEdit={onQuantityEdit}
                onDelete={onQuantityDelete}
              />
            </section>
          </div>
        )}
      </main>
      <AlertDialog
        open={isArchiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {quantity && !quantity.eq(0)
                ? `Change ${holdingName} to zero and archive?`
                : `Archive ${holdingName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {quantity && !quantity.eq(0) && (
                <>A zero valuation will be recorded for the current month. </>
              )}
              This holding will be removed from your active portfolio and
              totals. You can restore it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onArchiveHolding();
                setArchiveDialogOpen(false);
              }}
            >
              {quantity && !quantity.eq(0)
                ? "Change to zero and archive"
                : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {holdingDeleteModal}
    </>
  );
}

function ValuationHistoryList({
  rows,
  readOnly,
  nextRow,
  hasMore,
  isFetchingMore,
  onLoadMore,
  onEdit,
  onDelete,
}: {
  rows: ValueHistoryRow[];
  readOnly: boolean;
  nextRow?: ValueHistoryRow;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
  onEdit: (args: { id: string }) => void;
  onDelete: (args: { timestamp: Date }) => void;
}) {
  const { confirm, modal } = useConfirmDelete();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, onLoadMore]);

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        {rows.map((row, index) => {
          const previous = rows[index + 1] ?? nextRow;
          const change = previous
            ? row.valueInTarget.minus(previous.valueInTarget)
            : undefined;
          return (
            <div
              key={row.timestamp.toISOString()}
              className={cn(
                "group relative flex items-center gap-3 border-b px-3 py-2 last:border-b-0 sm:px-4",
                index === 0 && "bg-muted/25",
              )}
            >
              <HistoryDot
                latest={index === 0}
                accent="blue"
                className="hidden sm:block"
              />
              <button
                type="button"
                className="min-w-0 flex-1 text-left sm:flex sm:items-center sm:gap-3"
                disabled={
                  readOnly || !row.quantityId || !!row.quantityIsCarried
                }
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
              <span className="flex size-8 shrink-0 items-center justify-center">
                {!readOnly && row.quantityId && !row.quantityIsCarried && (
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
              </span>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex h-14 items-center justify-center"
        >
          {isFetchingMore && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" /> Loading more
            </span>
          )}
        </div>
      )}
      {modal}
    </>
  );
}
