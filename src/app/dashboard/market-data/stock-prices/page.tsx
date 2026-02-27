"use client";

import { useEffect, useState } from "react";
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
import { getCoreRowModel } from "@tanstack/react-table";
import { stockPricesColumns } from "./config";
import { DataTable } from "~/components/ui/data-table";
import { DataTableColumns } from "~/components/ui/data-table-columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useTable } from "~/hooks/useTable";

export default function StockPricesPage() {
  const [tickerId, setTickerId] = useState<string>();

  const {
    data = [],
    refetch,
    isPending,
  } = api.stockPrice.getAll.useQuery(
    {
      tickerId,
    },
    {
      enabled: !!tickerId,
    },
  );

  const table = useTable({
    data,
    columns: stockPricesColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      id: "stockPrices",
    },
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

  const { data: stockTickers = [], isPending: isFetchingStockTickers } =
    api.stockTicker.getAll.useQuery();

  useEffect(() => {
    setTickerId((state) => {
      if (state || !stockTickers[0]) return state;
      return stockTickers[0].id;
    });
  }, [stockTickers]);

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
      </header>

      <div className="mx-auto flex w-full max-w-screen-lg flex-col gap-2 p-5">
        <div className="grid grid-cols-2 gap-2 md:flex">
          <Select
            value={tickerId}
            disabled={isFetchingStockTickers}
            onValueChange={setTickerId}
          >
            <SelectTrigger
              isLoading={isFetchingStockTickers}
              className="col-span-full"
            >
              <SelectValue placeholder="Select a stock ticker" />
            </SelectTrigger>

            <SelectContent>
              {stockTickers.map((ticker) => (
                <SelectItem key={ticker.id} value={ticker.id}>
                  {ticker.ticker} – {ticker.name} ({ticker.exchange})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DataTableColumns table={table} />
          <Button variant="default" onClick={() => setNewDialogOpen(true)}>
            <Plus />
            Add
          </Button>
        </div>

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
