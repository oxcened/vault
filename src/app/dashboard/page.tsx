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
import { TableSkeleton } from "~/components/table-skeleton";
import { Skeleton } from "~/components/ui/skeleton";
import FinancialRunway from "./FinancialRunway";
import NetWorthForecast from "./NetWorthForecast";
import { NetWorthCard } from "./NetWorthCard";
import { CashFlowCard } from "./CashFlowCard";
import { AddTransactionDropdown } from "~/components/add-transaction-dropdown";
import { RecentTransactionTable } from "~/components/transactionTable/recent-transaction-table";

export default function OverviewPage() {
  const { data, isPending, refetch } = api.dashboard.getSummary.useQuery();
  const { data: session, status } = useSession();
  const utils = api.useUtils();
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
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
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
            <div className="flex justify-between gap-2">
              <div>
                {status === "loading" ? (
                  <Skeleton className="h-8" />
                ) : (
                  <p className="text-2xl font-semibold">
                    Hey, {session!.user.name}
                  </p>
                )}

                <p className="text-sm text-muted-foreground">
                  Your money at a glance
                </p>
              </div>

              <AddTransactionDropdown onSuccess={handleTransactionCreated} />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <NetWorthCard />
              <CashFlowCard />
              <NetWorthForecast />
              <FinancialRunway />
              <RecentTransactionTable
                className="col-span-full"
                transactions={transactions?.items}
                isPending={transactionsPending}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
