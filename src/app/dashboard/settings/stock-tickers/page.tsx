"use client";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { api } from "~/trpc/react";
import { TableSkeleton } from "~/components/table-skeleton";
import { DataTable } from "~/components/ui/data-table";
import { getCoreRowModel } from "@tanstack/react-table";
import { stockTickerColumns } from "./config";
import { useTable } from "~/hooks/useTable";
import { Button } from "~/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import { useState } from "react";
import NewStockTickerDialog from "./NewStockTickerDialog";

export default function StockTickersPage() {
  const { data = [], isPending, refetch } = api.stockTicker.getAll.useQuery();

  const table = useTable({
    data,
    columns: stockTickerColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      id: "stockTickers",
    },
  });

  const [isNewDialogOpen, setNewDialogOpen] = useState(false);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DashboardBreadcrumb
          items={[
            { label: "Settings", href: "/dashboard/settings" },
            { label: "Stock tickers" },
          ]}
        />
      </header>

      <main className="mx-auto flex w-full max-w-screen-lg flex-col gap-5 p-5 md:py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Stock tickers
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure the securities used to track market prices and value your
            holdings.
          </p>
        </div>

        <section className="rounded-2xl border bg-gradient-to-br from-blue-500/[0.07] via-card to-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-inset ring-blue-500/20">
                <TrendingUp className="size-5" />
              </span>
              <h2 className="font-semibold">Tracked securities</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Add a ticker before recording its monthly market prices or
                linking it to a stock holding.
              </p>
            </div>
            <Button
              className="h-11 sm:px-5"
              onClick={() => setNewDialogOpen(true)}
            >
              <Plus /> Add ticker
            </Button>
          </div>
        </section>

        <section>
          <div className="mb-3 px-1">
            <h2 className="font-semibold">Securities</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {data.length} {data.length === 1 ? "ticker" : "tickers"}
            </p>
          </div>
          {isPending ? (
            <TableSkeleton />
          ) : (
            <DataTable table={table} className="rounded-xl" />
          )}
        </section>
      </main>

      <NewStockTickerDialog
        key={`new-stock-ticker-dialog-${isNewDialogOpen}`}
        isOpen={isNewDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={refetch}
      />
    </>
  );
}
