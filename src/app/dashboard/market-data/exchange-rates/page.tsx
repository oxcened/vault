"use client";

import { useState } from "react";
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
import { Plus } from "lucide-react";
import NewExchangeRateDialog from "./NewExchangeRateDialog";
import { TableSkeleton } from "~/components/table-skeleton";
import { DataTable } from "~/components/ui/data-table";
import { getCoreRowModel } from "@tanstack/react-table";
import { exchangeRatesColumns } from "./config";
import { DataTableColumns } from "~/components/ui/data-table-columns";
import { useTable } from "~/hooks/useTable";

export default function ExchangeRatesPage() {
  const { data = [], refetch, isPending } = api.exchangeRate.getAll.useQuery();

  const table = useTable({
    data,
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
              <BreadcrumbPage>Market data</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Exchange rates</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-screen-lg flex-col gap-2 p-5">
        <div className="flex justify-end gap-2">
          <DataTableColumns table={table} />
          <Button variant="default" onClick={() => setNewDialog(true)}>
            <Plus />
            Add
          </Button>
        </div>

        {isPending ? <TableSkeleton /> : <DataTable table={table} />}
      </div>

      <NewExchangeRateDialog
        key={`new-exchange-rate-dialog-${isNewDialog}`}
        isOpen={isNewDialog}
        onOpenChange={setNewDialog}
        onSuccess={handleRateCreatedOrEdited}
      />
    </>
  );
}
