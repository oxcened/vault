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
import NewStockPriceDialog from "./NewStockPriceDialog";
import { TableSkeleton } from "~/components/table-skeleton";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import { stockPricesColumns } from "./config";
import { DataTable } from "~/components/ui/data-table";

export default function StockPricesPage() {
  const { data = [], refetch, isPending } = api.stockPrice.getAll.useQuery();

  const table = useReactTable({
    data: data,
    columns: stockPricesColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const utils = api.useUtils();

  const [isNewDialogOpen, setNewDialogOpen] = useState(false);

  function handleStockCreatedOrEdited() {
    void refetch();
    void utils.netWorthOverview.get.invalidate();
    void utils.netWorthAsset.getAll.invalidate();
    void utils.netWorthAsset.getDetailById.invalidate();
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
              <BreadcrumbPage>Stock prices</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setNewDialogOpen(true)}
          >
            <Plus />
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-screen-md p-5">
        {isPending ? <TableSkeleton /> : <DataTable table={table} />}
      </div>

      <NewStockPriceDialog
        key={`new-stock-price-dialog-${isNewDialogOpen}`}
        isOpen={isNewDialogOpen}
        onOpenChange={() => setNewDialogOpen(false)}
        onSuccess={handleStockCreatedOrEdited}
      />
    </>
  );
}
