"use client";

import { useMemo, useState, type ReactNode } from "react";
import { format, subMonths } from "date-fns";
import {
  ArrowRightLeft,
  Check,
  Circle,
  CircleDollarSign,
  ListChecks,
  Copy,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "~/components/ui/breadcrumb";
import { AmountInput } from "~/components/ui/amount-input";
import { Button } from "~/components/ui/button";
import { MonthPicker } from "~/components/ui/month-picker";
import { Number as FormattedNumber } from "~/components/ui/number";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Skeleton } from "~/components/ui/skeleton";
import { api, type RouterOutputs } from "~/trpc/react";
import { toMonthTimestamp } from "~/utils/date";

type UpdateData = RouterOutputs["monthEnd"]["get"];

const isValidValue = (value: string | undefined) => {
  const parsed = globalThis.Number(value);
  return value !== undefined && Number.isFinite(parsed) && parsed > 0;
};

export default function MonthEndPage() {
  const latestClosableMonth = toMonthTimestamp(subMonths(new Date(), 1));
  const [month, setMonth] = useState(latestClosableMonth);
  const { data, isPending } = api.monthEnd.get.useQuery({ month });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Monthly update</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="mx-auto flex w-full max-w-screen-lg flex-col gap-6 p-5 md:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-500">
              Data maintenance
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Monthly update
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update the market data used to value your finances.
            </p>
          </div>
          <MonthPicker
            value={month}
            maxMonth={latestClosableMonth}
            className="w-full sm:w-auto"
            onChange={setMonth}
          />
        </div>

        {isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : data ? (
          <UpdateForm key={month.toISOString()} month={month} data={data} />
        ) : null}
      </main>
    </>
  );
}

function UpdateForm({ month, data }: { month: Date; data: UpdateData }) {
  const utils = api.useUtils();
  const initialStockValues = useMemo(
    () =>
      Object.fromEntries(
        data.stockPrices.map((item) => [
          item.tickerId,
          item.currentValue?.toString() ?? "",
        ]),
      ),
    [data.stockPrices],
  );
  const initialRateValues = useMemo(
    () =>
      Object.fromEntries(
        data.exchangeRates.map((item) => [
          `${item.baseCurrency}:${item.quoteCurrency}`,
          item.currentValue?.toString() ?? "",
        ]),
      ),
    [data.exchangeRates],
  );
  const [stockValues, setStockValues] =
    useState<Record<string, string>>(initialStockValues);
  const [rateValues, setRateValues] =
    useState<Record<string, string>>(initialRateValues);
  const [confirmedStocks, setConfirmedStocks] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(
      data.stockPrices.map((item) => [item.tickerId, item.isClosing]),
    ),
  );
  const [confirmedRates, setConfirmedRates] = useState<Record<string, boolean>>(
    Object.fromEntries(
      data.exchangeRates.map((item) => [
        `${item.baseCurrency}:${item.quoteCurrency}`,
        item.isClosing,
      ]),
    ),
  );

  const total = data.stockPrices.length + data.exchangeRates.length;
  const completedStocks = data.stockPrices.filter(
    (item) =>
      confirmedStocks[item.tickerId] &&
      isValidValue(stockValues[item.tickerId]),
  ).length;
  const completedRates = data.exchangeRates.filter((item) => {
    const key = `${item.baseCurrency}:${item.quoteCurrency}`;
    return confirmedRates[key] && isValidValue(rateValues[key]);
  }).length;
  const completed = completedStocks + completedRates;
  const remaining = total - completed;

  const save = api.monthEnd.save.useMutation({
    onSuccess: async () => {
      toast.success(`${format(month, "MMMM yyyy")} closing values saved.`);
      await Promise.all([
        utils.monthEnd.get.invalidate(),
        utils.stockPrice.getAll.invalidate(),
        utils.stockTicker.getAll.invalidate(),
        utils.exchangeRate.getAll.invalidate(),
        utils.netWorthOverview.get.invalidate(),
        utils.netWorthAsset.getAll.invalidate(),
        utils.netWorthDebt.getAll.invalidate(),
        utils.dashboard.getSummary.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSave = () => {
    save.mutate({
      month,
      stockPrices: data.stockPrices.flatMap((item) => {
        if (!confirmedStocks[item.tickerId]) return [];
        const value = globalThis.Number(stockValues[item.tickerId]);
        return Number.isFinite(value) && value > 0
          ? [{ tickerId: item.tickerId, value }]
          : [];
      }),
      exchangeRates: data.exchangeRates.flatMap((item) => {
        const key = `${item.baseCurrency}:${item.quoteCurrency}`;
        if (!confirmedRates[key]) return [];
        const value = globalThis.Number(rateValues[key]);
        return Number.isFinite(value) && value > 0
          ? [
              {
                baseCurrency: item.baseCurrency,
                quoteCurrency: item.quoteCurrency,
                value,
              },
            ]
          : [];
      }),
    });
  };

  if (total === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
        <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <Check className="size-5" />
        </span>
        <h2 className="font-medium">Nothing to update</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          No market data was maintained in the previous month, so there is no
          update queue for {format(month, "MMMM yyyy")}.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            {completed === total ? (
              <Check className="size-5" />
            ) : (
              <ListChecks className="size-5" />
            )}
          </span>
          <div>
            <p className="font-medium">
              {completed === total ? "Ready to complete" : "Update in progress"}
            </p>
            <p className="text-sm text-muted-foreground">
              {completed === total
                ? `All ${total} closing values are ready for ${format(month, "MMMM yyyy")}.`
                : `${remaining} ${remaining === 1 ? "value" : "values"} remaining for ${format(month, "MMMM yyyy")}.`}
            </p>
          </div>
        </div>
        <div className="min-w-48">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>{completed} ready</span>
            <span>{total} total</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-blue-500 transition-[width]"
              style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </section>

      {data.stockPrices.length > 0 && (
        <UpdateSection
          title="Stock prices"
          description="Monthly closing prices for actively maintained securities."
          icon={CircleDollarSign}
          completed={completedStocks}
          total={data.stockPrices.length}
          onCarryAll={() => {
            setStockValues((values) => ({
              ...values,
              ...Object.fromEntries(
                data.stockPrices.flatMap((item) =>
                  item.previousValue
                    ? [[item.tickerId, item.previousValue.toString()]]
                    : [],
                ),
              ),
            }));
            setConfirmedStocks((items) => ({
              ...items,
              ...Object.fromEntries(
                data.stockPrices.flatMap((item) =>
                  item.previousValue ? [[item.tickerId, true]] : [],
                ),
              ),
            }));
          }}
        >
          {data.stockPrices.map((item) => (
            <UpdateRow
              key={item.tickerId}
              title={item.ticker}
              description={`${item.name} · ${item.exchange}`}
              previous={
                item.previousValue ? (
                  <FormattedNumber
                    value={item.previousValue}
                    options={{ maximumFractionDigits: 8 }}
                  />
                ) : undefined
              }
              confirmed={confirmedStocks[item.tickerId] ?? false}
              canConfirm={isValidValue(stockValues[item.tickerId])}
              onConfirm={() =>
                setConfirmedStocks((items) => ({
                  ...items,
                  [item.tickerId]: true,
                }))
              }
              onCarry={
                item.previousValue
                  ? () => {
                      setStockValues((values) => ({
                        ...values,
                        [item.tickerId]: item.previousValue!.toString(),
                      }));
                      setConfirmedStocks((items) => ({
                        ...items,
                        [item.tickerId]: true,
                      }));
                    }
                  : undefined
              }
            >
              <AmountInput
                value={stockValues[item.tickerId]}
                maxFractionDigits={8}
                placeholder="Enter price"
                onValueChange={(value) => {
                  setStockValues((values) => ({
                    ...values,
                    [item.tickerId]: value,
                  }));
                  setConfirmedStocks((items) => ({
                    ...items,
                    [item.tickerId]: true,
                  }));
                }}
              />
            </UpdateRow>
          ))}
        </UpdateSection>
      )}

      {data.exchangeRates.length > 0 && (
        <UpdateSection
          title="Exchange rates"
          description="Monthly conversion rates for active currency pairs."
          icon={ArrowRightLeft}
          completed={completedRates}
          total={data.exchangeRates.length}
          onCarryAll={() => {
            setRateValues((values) => ({
              ...values,
              ...Object.fromEntries(
                data.exchangeRates.flatMap((item) =>
                  item.previousValue
                    ? [
                        [
                          `${item.baseCurrency}:${item.quoteCurrency}`,
                          item.previousValue.toString(),
                        ],
                      ]
                    : [],
                ),
              ),
            }));
            setConfirmedRates((items) => ({
              ...items,
              ...Object.fromEntries(
                data.exchangeRates.flatMap((item) =>
                  item.previousValue
                    ? [[`${item.baseCurrency}:${item.quoteCurrency}`, true]]
                    : [],
                ),
              ),
            }));
          }}
        >
          {data.exchangeRates.map((item) => {
            const key = `${item.baseCurrency}:${item.quoteCurrency}`;
            return (
              <UpdateRow
                key={key}
                title={`${item.baseCurrency} → ${item.quoteCurrency}`}
                description={`1 ${item.baseCurrency} in ${item.quoteCurrency}`}
                previous={
                  item.previousValue ? (
                    <FormattedNumber
                      value={item.previousValue}
                      options={{ maximumFractionDigits: 8 }}
                    />
                  ) : undefined
                }
                confirmed={confirmedRates[key] ?? false}
                canConfirm={isValidValue(rateValues[key])}
                onConfirm={() =>
                  setConfirmedRates((items) => ({ ...items, [key]: true }))
                }
                onCarry={
                  item.previousValue
                    ? () => {
                        setRateValues((values) => ({
                          ...values,
                          [key]: item.previousValue!.toString(),
                        }));
                        setConfirmedRates((items) => ({
                          ...items,
                          [key]: true,
                        }));
                      }
                    : undefined
                }
              >
                <AmountInput
                  value={rateValues[key]}
                  currency={item.quoteCurrency}
                  maxFractionDigits={8}
                  placeholder="Enter rate"
                  onValueChange={(value) => {
                    setRateValues((values) => ({ ...values, [key]: value }));
                    setConfirmedRates((items) => ({ ...items, [key]: true }));
                  }}
                />
              </UpdateRow>
            );
          })}
        </UpdateSection>
      )}

      <section className="flex flex-col gap-4 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="font-medium">
            {completed === total
              ? "Everything is ready"
              : `${completed} of ${total} values ready`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completed === total
              ? "Complete the month to save these closing values and refresh your financial snapshots."
              : "You can save ready values now and return later for the rest."}
          </p>
        </div>
        <Button
          className="w-full shrink-0 sm:w-auto"
          disabled={completed === 0 || save.isPending}
          onClick={handleSave}
        >
          {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          {completed === total ? "Complete month" : "Save confirmed values"}
        </Button>
      </section>
    </>
  );
}

function UpdateSection({
  title,
  description,
  icon: Icon,
  completed,
  total,
  onCarryAll,
  children,
}: {
  title: string;
  description: string;
  icon: typeof CircleDollarSign;
  completed: number;
  total: number;
  onCarryAll: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-col gap-3 border-b bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{title}</h2>
              <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
                {completed}/{total} ready
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {completed < total && (
          <Button variant="outline" size="sm" onClick={onCarryAll}>
            <RotateCcw /> Use all previous
          </Button>
        )}
      </div>
      <div className="divide-y">{children}</div>
    </section>
  );
}

function UpdateRow({
  title,
  description,
  previous,
  confirmed,
  canConfirm,
  onConfirm,
  onCarry,
  children,
}: {
  title: string;
  description: string;
  previous?: ReactNode;
  confirmed: boolean;
  canConfirm: boolean;
  onConfirm: () => void;
  onCarry?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_10rem_minmax(14rem,18rem)] sm:items-center sm:px-5">
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Previous month
        </p>
        {previous && onCarry ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-medium tabular-nums transition-colors hover:bg-muted"
            onClick={onCarry}
          >
            {previous}
            <Copy className="size-3 text-muted-foreground" />
            <span className="sr-only">Use previous month value</span>
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">Not available</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Closing value
        </p>
        {children}
        <div className="mt-1.5 flex min-h-7 items-center justify-end">
          {confirmed && canConfirm ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
              <Check className="size-3.5" /> Ready
            </span>
          ) : canConfirm ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!canConfirm}
              onClick={onConfirm}
            >
              Confirm existing value
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-amber-500">
              <Circle className="size-3 fill-current" /> Value required
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
