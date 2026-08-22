"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  CalendarDays,
  ChartNoAxesCombined,
  Database,
  Plus,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import NewStockPriceDialog from "./NewStockPriceDialog";
import { TableSkeleton } from "~/components/table-skeleton";
import { getCoreRowModel } from "@tanstack/react-table";
import { stockPricesColumns } from "./config";
import { DataTable } from "~/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useTable } from "~/hooks/useTable";
import { Number } from "~/components/ui/number";
import { formatDate } from "~/utils/date";

export default function StockPricesPage() {
  const [tickerId, setTickerId] = useState<string>();

  const {
    data = [],
    refetch,
    isPending,
  } = api.stockPrice.getAll.useQuery(
    {
      tickerId,
    },
    {
      enabled: !!tickerId,
    },
  );

  const table = useTable({
    data,
    columns: stockPricesColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      id: "stockPrices",
    },
  });

  const utils = api.useUtils();

  const [isNewDialogOpen, setNewDialogOpen] = useState(false);

  function handleStockCreatedOrEdited() {
    void refetch();
    void utils.stockTicker.getAll.invalidate();
    void utils.netWorthOverview.get.invalidate();
    void utils.netWorthAsset.getAll.invalidate();
    void utils.netWorthAsset.getDetailById.invalidate();
    void utils.dashboard.getSummary.invalidate();
  }

  const { data: stockTickers = [], isPending: isFetchingStockTickers } =
    api.stockTicker.getAll.useQuery();

  useEffect(() => {
    setTickerId((state) => {
      if (state || !stockTickers[0]) return state;
      return stockTickers[0].id;
    });
  }, [stockTickers]);

  const selectedTicker = stockTickers.find((ticker) => ticker.id === tickerId);
  const latestPrice = data[0];
  const previousPrice = data[1];
  const priceChange =
    latestPrice && previousPrice
      ? latestPrice.price.minus(previousPrice.price)
      : undefined;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Stock prices</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="mx-auto flex w-full max-w-screen-lg flex-col gap-5 p-5 md:py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Stock prices
          </h1>
          <p className="text-sm text-muted-foreground">
            Maintain monthly prices used to calculate your portfolio value.
          </p>
        </div>

        {stockTickers.length === 0 && !isFetchingStockTickers ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
            <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Database className="size-5" />
            </span>
            <h2 className="font-medium">Add a stock ticker first</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Prices are attached to the securities configured in Vault.
            </p>
            <Button asChild className="mt-5">
              <Link href="/dashboard/settings/stock-tickers">
                <Settings2 /> Manage stock tickers
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border bg-gradient-to-br from-blue-500/[0.07] via-card to-card p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Security
                  </label>
                  <Select
                    value={tickerId}
                    disabled={isFetchingStockTickers}
                    onValueChange={setTickerId}
                  >
                    <SelectTrigger
                      isLoading={isFetchingStockTickers}
                      className="h-11 w-full bg-background/70 sm:max-w-md"
                    >
                      <SelectValue placeholder="Select a stock ticker" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockTickers.map((ticker) => (
                        <SelectItem key={ticker.id} value={ticker.id}>
                          {ticker.ticker} – {ticker.name} ({ticker.exchange})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="h-11 sm:px-5"
                  disabled={!tickerId}
                  onClick={() => setNewDialogOpen(true)}
                >
                  <Plus /> Add monthly price
                </Button>
              </div>

              {selectedTicker && (
                <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-5 sm:grid-cols-3">
                  <SummaryItem
                    icon={ChartNoAxesCombined}
                    label="Latest price"
                    className="col-span-2 min-w-0 sm:col-span-1"
                    value={
                      latestPrice ? (
                        <Number
                          value={latestPrice.price}
                          options={{ maximumFractionDigits: 4 }}
                        />
                      ) : (
                        "No data"
                      )
                    }
                    detail={
                      priceChange ? (
                        <Number
                          value={priceChange}
                          options={{
                            signDisplay: "always",
                            maximumFractionDigits: 4,
                          }}
                          className={
                            priceChange.gte(0)
                              ? "text-financial-positive"
                              : "text-financial-negative"
                          }
                        />
                      ) : undefined
                    }
                  />
                  <SummaryItem
                    icon={CalendarDays}
                    label="Last updated"
                    value={
                      latestPrice
                        ? formatDate({
                            date: latestPrice.timestamp,
                            options: {
                              month: "long",
                              year: "numeric",
                              timeZone: "UTC",
                            },
                          })
                        : "—"
                    }
                  />
                  <SummaryItem
                    icon={Database}
                    label="History"
                    value={`${data.length} ${data.length === 1 ? "entry" : "entries"}`}
                    className="col-span-2 sm:col-span-1"
                  />
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-end justify-between gap-3 px-1">
                <div>
                  <h2 className="font-semibold">Price history</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedTicker
                      ? `${selectedTicker.ticker} · ${selectedTicker.exchange}`
                      : "Select a security to view its history"}
                  </p>
                </div>
              </div>
              {isPending ? (
                <TableSkeleton />
              ) : (
                <DataTable table={table} className="rounded-xl" />
              )}
            </section>
          </>
        )}
      </main>

      <NewStockPriceDialog
        key={`new-stock-price-dialog-${isNewDialogOpen}`}
        isOpen={isNewDialogOpen}
        onOpenChange={() => setNewDialogOpen(false)}
        onSuccess={handleStockCreatedOrEdited}
        defaultTickerId={tickerId}
      />
    </>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  detail,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className ?? ""}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-lg font-semibold tabular-nums">
        {value}
        {detail && <span className="text-xs font-medium">{detail}</span>}
      </div>
    </div>
  );
}
