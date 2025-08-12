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
import { TransactionTable } from "~/components/transaction-table";
import { Skeleton } from "~/components/ui/skeleton";
import FinancialRunway from "./FinancialRunway";
import NetWorthForecast from "./NetWorthForecast";
import { NetWorthCard } from "./NetWorthCard";
import { CashFlowCard } from "./CashFlowCard";

export default function OverviewPage() {
  const { data, isPending } = api.dashboard.getSummary.useQuery();
  const { data: session, status } = useSession();

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

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <NetWorthCard />
              <CashFlowCard />
              <NetWorthForecast />
              <FinancialRunway />

              <div className="col-span-full [&_td]:px-6 [&_td]:py-3 [&_th]:px-6 [&_th]:py-3">
                <TransactionTable
                  showSeeAllLink
                  data={data.recentTransactions}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
