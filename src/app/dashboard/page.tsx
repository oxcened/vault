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
import { RoundedCurrency } from "~/components/ui/number";
import { ChartNoAxesCombined, PiggyBank } from "lucide-react";
import { TableSkeleton } from "~/components/table-skeleton";
import { TransactionTable } from "~/components/transaction-table";
import { TrendIndicator } from "~/components/ui/trend-indicator";
import { DECIMAL_ZERO } from "~/utils/number";
import { Skeleton } from "~/components/ui/skeleton";

export default function DashboardPage() {
  const { data, isPending } = api.dashboard.getSummary.useQuery();
  const { data: session, status } = useSession();

  const netWorthForecast = data?.netWorth?.netValue.plus(
    (data.cashFlow?.netFlow ?? DECIMAL_ZERO).mul(12),
  );
  const financialRunwayMonths = data?.netWorth?.totalAssets
    .div(data.cashFlow?.expenses ?? DECIMAL_ZERO)
    .toFixed(0);

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

      {isPending && (
        <div className="mx-auto w-full max-w-screen-md p-5">
          <TableSkeleton />
        </div>
      )}

      {!isPending && !data && (
        <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
          You don&apos;t have enough data yet
        </div>
      )}

      {!isPending && data && (
        <>
          <div className="mx-auto w-full max-w-screen-md p-5">
            {status === "loading" ? (
              <Skeleton className="h-9" />
            ) : (
              <p className="text-3xl">Hey, {session!.user.name}</p>
            )}

            <div className="mt-10 flex flex-col gap-16">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground">Net worth</p>
                  </div>

                  <div className="flex items-end gap-3">
                    <p className="text-3xl">
                      <RoundedCurrency value={data.netWorth?.netValue} />
                    </p>
                    <TrendIndicator value={data.netWorthTrend} />
                  </div>

                  <div className="mt-5 flex gap-5">
                    <div>
                      <p className="text-sm text-muted-foreground">Assets</p>
                      <div className="flex items-end gap-3">
                        <p className="text-xl">
                          <RoundedCurrency value={data.netWorth?.totalAssets} />
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Debts</p>
                      <div className="flex items-end gap-3">
                        <p className="text-xl">
                          <RoundedCurrency value={data.netWorth?.totalDebts} />
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
                      <RoundedCurrency value={data.cashFlow?.netFlow} />
                    </p>
                    <TrendIndicator value={data.cashFlowTrend} />
                  </div>

                  <div className="mt-5 flex gap-5">
                    <div>
                      <p className="text-sm text-muted-foreground">Income</p>
                      <div className="flex items-end gap-3">
                        <p className="text-xl">
                          <RoundedCurrency value={data.cashFlow?.income} />
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Expenses</p>
                      <div className="flex items-end gap-3">
                        <p className="text-xl">
                          <RoundedCurrency value={data.cashFlow?.expenses} />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

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
                      At your current cash flow trend, your net worth could{" "}
                      {netWorthForecast?.gt(0) ? "grow" : "shrink"} to{" "}
                      <RoundedCurrency value={netWorthForecast} /> in a year.
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

              <Separator />

              <TransactionTable showSeeAllLink data={data.recentTransactions} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
