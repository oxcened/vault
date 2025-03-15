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
import { Percentage, RoundedCurrency } from "~/components/ui/number";
import {
  ChartNoAxesCombined,
  PiggyBank,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { TableSkeleton } from "~/components/table-skeleton";
import { TransactionTable } from "~/components/transaction-table";

export default function DashboardPage() {
  const { data, isLoading } = api.dashboard.getSummary.useQuery();
  const { data: session, status } = useSession();

  const netWorthForecast = data?.netWorth.plus(data.cashFlow.mul(12));
  const financialRunwayMonths = data?.totalAssets
    .div(data.totalExpenses)
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

      {(isLoading || status === "loading") && (
        <div className="mx-auto w-full max-w-screen-md p-5">
          <TableSkeleton />
        </div>
      )}

      {!isLoading && status !== "loading" && !data && (
        <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
          You don't have enough data yet
        </div>
      )}

      {!isLoading && status !== "loading" && data && (
        <>
          <div className="mx-auto w-full max-w-screen-md p-5">
            <p className="text-3xl">Hey, {session!.user.name}</p>

            <div className="mt-10 flex flex-col gap-16">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground">Net worth</p>
                  </div>

                  <div className="flex items-end gap-3">
                    <p className="text-3xl">
                      <RoundedCurrency value={data.netWorth} />
                    </p>
                    {data.netWorthTrend?.eq(0) === false && (
                      <div
                        className={cn(
                          "flex items-center gap-1 self-center rounded-lg text-sm",
                          data.netWorthTrend.gt(0)
                            ? "text-financial-positive"
                            : "text-financial-negative",
                        )}
                      >
                        {data.netWorthTrend.gt(0) ? (
                          <TrendingUp className="size-4" />
                        ) : (
                          <TrendingDown className="size-4" />
                        )}
                        <p>
                          <Percentage value={data.netWorthTrend} /> this month
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex gap-5">
                    <div>
                      <p className="text-sm text-muted-foreground">Assets</p>
                      <div className="flex items-end gap-3">
                        <p className="text-xl">
                          <RoundedCurrency value={data.totalAssets} />
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Debts</p>
                      <div className="flex items-end gap-3">
                        <p className="text-xl">
                          <RoundedCurrency value={data.totalDebts} />
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
                      <RoundedCurrency value={data.cashFlow} />
                    </p>
                    {data.cashFlowTrend?.eq(0) === false && (
                      <div
                        className={cn(
                          "flex items-center gap-1 self-center rounded-lg text-sm",
                          data.cashFlowTrend.gt(0)
                            ? "text-financial-positive"
                            : "text-financial-negative",
                        )}
                      >
                        {data.cashFlowTrend.gt(0) ? (
                          <TrendingUp className="size-4" />
                        ) : (
                          <TrendingDown className="size-4" />
                        )}
                        <p>
                          <Percentage value={data.cashFlowTrend} /> this month
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex gap-5">
                    <div>
                      <p className="text-sm text-muted-foreground">Income</p>
                      <div className="flex items-end gap-3">
                        <p className="text-xl">
                          <RoundedCurrency value={data.totalIncome} />
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Expenses</p>
                      <div className="flex items-end gap-3">
                        <p className="text-xl">
                          <RoundedCurrency value={data.totalExpenses} />
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
