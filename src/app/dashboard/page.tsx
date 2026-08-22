"use client";

import { api } from "~/trpc/react";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Separator } from "~/components/ui/separator";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { Skeleton } from "~/components/ui/skeleton";
import FinancialRunway from "./FinancialRunway";
import NetWorthForecast from "./NetWorthForecast";
import { NetWorthCard } from "./NetWorthCard";
import { CashFlowCard } from "./CashFlowCard";
import { AddTransactionDropdown } from "~/components/add-transaction-dropdown";
import { RecentTransactionTable } from "~/components/transactionTable/recent-transaction-table";
import { CalendarClock, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { format, subMonths } from "date-fns";
import { WhatChanged } from "./WhatChanged";
import { toMonthTimestamp } from "~/utils/date";

export default function OverviewPage() {
  const { data, isPending, refetch } = api.dashboard.getSummary.useQuery();
  const utils = api.useUtils();
  const { data: schedules = [] } = api.recurringTransaction.getAll.useQuery();
  const { data: monthlyUpdate } = api.monthEnd.get.useQuery({
    month: toMonthTimestamp(subMonths(new Date(), 1)),
  });
  const { data: transactions, isPending: transactionsPending } =
    api.transaction.getAll.useQuery({
      page: 1,
      pageSize: 5,
      sortOrder: "desc",
      sortField: "timestamp",
      includeTotal: false,
      statuses: ["POSTED"],
    });

  const handleTransactionCreated = () => {
    void refetch();
    void utils.transaction.getAll.invalidate();
    void utils.cashFlow.getMonthlyCashFlow.invalidate();
    void utils.cashFlow.getAll.invalidate();
    void utils.recurringTransaction.getAll.invalidate();
  };

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const attentionCount = schedules.filter(
    (schedule) => !schedule.isPaused && schedule.nextDate <= endOfToday,
  ).length;
  const marketDataAttentionCount = monthlyUpdate
    ? [...monthlyUpdate.stockPrices, ...monthlyUpdate.exchangeRates].filter(
        (item) => !item.isClosing,
      ).length
    : 0;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DashboardBreadcrumb items={[{ label: "Overview" }]} />
      </header>

      {isPending && (
        <div className="mx-auto grid w-full max-w-screen-lg gap-4 p-5 md:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="col-span-full h-72 rounded-xl" />
        </div>
      )}

      {!isPending && !data && (
        <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
          You don&apos;t have enough data yet
        </div>
      )}

      {!isPending && data && (
        <>
          <main className="mx-auto w-full max-w-screen-lg space-y-7 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Overview
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {format(new Date(), "EEEE, d MMMM")}
                </p>
              </div>

              <AddTransactionDropdown onSuccess={handleTransactionCreated} />
            </div>

            <section
              aria-label="Financial snapshot"
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <NetWorthCard />
              <CashFlowCard />
            </section>

            {(attentionCount > 0 || marketDataAttentionCount > 0) && (
              <section aria-labelledby="attention-heading">
                <h2 id="attention-heading" className="mb-2 text-sm font-medium">
                  Needs attention
                </h2>
                <div className="space-y-2">
                  {marketDataAttentionCount > 0 && (
                    <Link
                      href="/dashboard/monthly-update"
                      className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 px-4 py-3 transition-colors hover:bg-blue-500/10"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                        <RefreshCw className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {marketDataAttentionCount} market data update
                          {marketDataAttentionCount === 1 ? " is" : "s are"} due
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Confirm {format(subMonths(new Date(), 1), "MMMM")}{" "}
                          closing values
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  )}
                  {attentionCount > 0 && (
                    <Link
                      href="/dashboard/transactions?view=scheduled"
                      className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 transition-colors hover:bg-amber-500/10"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                        <CalendarClock className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {attentionCount} scheduled transaction
                          {attentionCount === 1 ? " needs" : "s need"} attention
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Record or skip what&apos;s due
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  )}
                </div>
              </section>
            )}

            <WhatChanged />

            <RecentTransactionTable
              transactions={transactions?.items}
              isPending={transactionsPending}
            />

            <section aria-labelledby="outlook-heading">
              <h2 id="outlook-heading" className="mb-2 text-sm font-medium">
                Outlook
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <NetWorthForecast />
                <FinancialRunway />
              </div>
            </section>
          </main>
        </>
      )}
    </>
  );
}
