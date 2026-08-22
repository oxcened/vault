"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  ArrowRightLeft,
  CalendarDays,
  Database,
  Plus,
  type LucideIcon,
} from "lucide-react";
import NewExchangeRateDialog from "./NewExchangeRateDialog";
import { TableSkeleton } from "~/components/table-skeleton";
import { DataTable } from "~/components/ui/data-table";
import { getCoreRowModel } from "@tanstack/react-table";
import { exchangeRatesColumns } from "./config";
import { useTable } from "~/hooks/useTable";
import { Number } from "~/components/ui/number";
import { formatDate } from "~/utils/date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const pairKey = (baseCurrency: string, quoteCurrency: string) =>
  `${baseCurrency}:${quoteCurrency}`;
const EMPTY_RATES: never[] = [];

export default function ExchangeRatesPage() {
  const {
    data: queryData,
    refetch,
    isPending,
  } = api.exchangeRate.getAll.useQuery();
  const data = queryData ?? EMPTY_RATES;
  const pairs = useMemo(() => {
    const seen = new Set<string>();
    return data.flatMap((rate) => {
      const key = pairKey(rate.baseCurrency, rate.quoteCurrency);
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ key, base: rate.baseCurrency, quote: rate.quoteCurrency }];
    });
  }, [data]);
  const [selectedPairKey, setSelectedPairKey] = useState<string>();

  useEffect(() => {
    setSelectedPairKey((current) => {
      if (current && pairs.some((pair) => pair.key === current)) return current;
      return pairs[0]?.key;
    });
  }, [pairs]);

  const selectedPair = pairs.find((pair) => pair.key === selectedPairKey);
  const filteredRates = useMemo(
    () =>
      data.filter(
        (rate) =>
          selectedPair &&
          rate.baseCurrency === selectedPair.base &&
          rate.quoteCurrency === selectedPair.quote,
      ),
    [data, selectedPair],
  );
  const latestRate = filteredRates[0];
  const previousRate = filteredRates[1];
  const rateChange =
    latestRate && previousRate
      ? latestRate.rate.minus(previousRate.rate)
      : undefined;

  const table = useTable({
    data: filteredRates,
    columns: exchangeRatesColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      id: "exchangeRates",
    },
  });

  const [isNewDialog, setNewDialog] = useState(false);

  const utils = api.useUtils();

  function handleRateCreatedOrEdited() {
    void refetch();
    void utils.netWorthOverview.get.invalidate();
    void utils.netWorthAsset.getAll.invalidate();
    void utils.netWorthAsset.getDetailById.invalidate();
    void utils.netWorthDebt.getAll.invalidate();
    void utils.netWorthDebt.getDetailById.invalidate();
    void utils.dashboard.getSummary.invalidate();
  }

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
              <BreadcrumbPage>Exchange rates</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="mx-auto flex w-full max-w-screen-lg flex-col gap-5 p-5 md:py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Exchange rates
          </h1>
          <p className="text-sm text-muted-foreground">
            Maintain monthly conversion rates used across your finances.
          </p>
        </div>

        {data.length === 0 && !isPending ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
            <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ArrowRightLeft className="size-5" />
            </span>
            <h2 className="font-medium">Add your first currency pair</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create a monthly rate to convert holdings into your main currency.
            </p>
            <Button className="mt-5" onClick={() => setNewDialog(true)}>
              <Plus /> Add exchange rate
            </Button>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border bg-gradient-to-br from-emerald-500/[0.07] via-card to-card p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Currency pair
                  </label>
                  <Select
                    value={selectedPairKey}
                    disabled={isPending}
                    onValueChange={setSelectedPairKey}
                  >
                    <SelectTrigger
                      isLoading={isPending}
                      className="h-11 w-full bg-background/70 sm:max-w-md"
                    >
                      <SelectValue placeholder="Select a currency pair" />
                    </SelectTrigger>
                    <SelectContent>
                      {pairs.map((pair) => (
                        <SelectItem key={pair.key} value={pair.key}>
                          {pair.base} → {pair.quote}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="h-11 sm:px-5"
                  onClick={() => setNewDialog(true)}
                >
                  <Plus /> Add monthly rate
                </Button>
              </div>

              {selectedPair && (
                <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-5 sm:grid-cols-3">
                  <SummaryItem
                    icon={ArrowRightLeft}
                    label={`1 ${selectedPair.base} equals`}
                    className="col-span-2 min-w-0 sm:col-span-1"
                    value={
                      latestRate ? (
                        <>
                          <Number
                            value={latestRate.rate}
                            options={{ maximumFractionDigits: 8 }}
                          />{" "}
                          <span className="text-sm text-muted-foreground">
                            {selectedPair.quote}
                          </span>
                        </>
                      ) : (
                        "No data"
                      )
                    }
                    detail={
                      rateChange ? (
                        <Number
                          value={rateChange}
                          options={{
                            signDisplay: "always",
                            maximumFractionDigits: 8,
                          }}
                          className={
                            rateChange.gte(0)
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
                      latestRate
                        ? formatDate({
                            date: latestRate.timestamp,
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
                    value={`${filteredRates.length} ${filteredRates.length === 1 ? "entry" : "entries"}`}
                    className="col-span-2 sm:col-span-1"
                  />
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 px-1">
                <h2 className="font-semibold">Rate history</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {selectedPair
                    ? `${selectedPair.base} to ${selectedPair.quote}`
                    : "Select a currency pair to view its history"}
                </p>
              </div>
              {isPending ? (
                <TableSkeleton columns={3} />
              ) : (
                <DataTable table={table} />
              )}
            </section>
          </>
        )}
      </main>

      <NewExchangeRateDialog
        key={`new-exchange-rate-dialog-${isNewDialog}`}
        isOpen={isNewDialog}
        onOpenChange={setNewDialog}
        onSuccess={handleRateCreatedOrEdited}
        defaultBaseCurrency={selectedPair?.base}
        defaultQuoteCurrency={selectedPair?.quote}
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
