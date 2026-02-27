import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { TableSkeleton } from "~/components/table-skeleton";
import { Currency, RoundedCurrency } from "~/components/ui/number";
import type Decimal from "decimal.js";
import { Button } from "../ui/button";
import { PlusIcon } from "lucide-react";
import { getCoreRowModel } from "@tanstack/react-table";
import { holdingDetailColumn } from "./config";
import { DataTable } from "../ui/data-table";
import { DataTableColumns } from "../ui/data-table-columns";
import { useTable } from "~/hooks/useTable";

export type ValueHistoryRow = {
  timestamp: Date;
  quantity: Decimal;
  quantityId: string | null;
  quantityIsCarried: boolean | null;
  stockPrice?: Decimal | null;
  stockPriceId?: string | null;
  stockPriceIsCarried?: boolean | null;
  fxRate: Decimal | null;
  fxRateId: string | null;
  fxRateIsCarried: boolean | null;
  valueInTarget: Decimal;
};

export function HoldingDetail({
  holdingCurrency,
  holdingComputedValue,
  holdingName,
  isCategoryStock = false,
  isPending,
  latestStockPrice,
  ticker,
  tickerExchange,
  tickerName,
  valueHistory = [],
  type,
  onQuantityEdit,
  onQuantityDelete,
  onNewHolding,
}: {
  holdingName?: string;
  isPending: boolean;
  holdingComputedValue?: Decimal;
  holdingCurrency?: string;
  isCategoryStock?: boolean;
  ticker?: string;
  tickerName?: string;
  tickerExchange?: string;
  latestStockPrice?: Decimal;
  valueHistory?: ValueHistoryRow[];
  type: "asset" | "debt";
  onQuantityEdit: (args: { id: string }) => void;
  onQuantityDelete: (args: { timestamp: Date }) => void;
  onNewHolding: () => void;
}) {
  const table = useTable({
    data: valueHistory,
    columns: holdingDetailColumn,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      id: `holdingDetail_${type === "asset" ? "Assets" : "Debts"}`,
      onQuantityEdit,
      onQuantityDelete,
    },
    initialState: {
      columnVisibility: {
        quantity: false,
        stockPrice: false,
        fxRate: false,
      },
    },
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard/net-worth">
                Net worth
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink
                href={`/dashboard/net-worth/${type === "asset" ? "assets" : "debts"}`}
              >
                {type === "asset" ? "Assets" : "Debts"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{holdingName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto w-full max-w-screen-lg p-5">
        {isPending && <TableSkeleton />}

        {!isPending && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="mr-auto">
                <p className="text-sm text-muted-foreground">{holdingName}</p>
                <p className="text-3xl font-semibold">
                  <RoundedCurrency value={holdingComputedValue} />
                </p>
              </div>

              <DataTableColumns table={table} />

              <Button variant="default" onClick={onNewHolding}>
                <PlusIcon />
                Add
              </Button>
            </div>

            <Overview
              holdingCurrency={holdingCurrency}
              isCategoryStock={isCategoryStock}
              latestStockPrice={latestStockPrice}
              ticker={ticker}
              tickerName={tickerName}
              tickerExchange={tickerExchange}
            />

            <DataTable table={table} />
          </div>
        )}
      </div>
    </>
  );
}

export function Overview({
  ticker,
  tickerName,
  tickerExchange,
  isCategoryStock,
  holdingCurrency,
  latestStockPrice,
}: {
  holdingCurrency?: string;
  tickerName?: string;
  ticker?: string;
  tickerExchange?: string;
  isCategoryStock?: boolean;
  latestStockPrice?: Decimal;
}) {
  return (
    <>
      {isCategoryStock && (
        <div className="flex items-center justify-between rounded-lg border p-5 text-sm">
          <div>
            <p>{tickerName}</p>
            <p className="text-muted-foreground">
              {ticker} &middot; {tickerExchange}
            </p>
          </div>
          <p>
            <Currency
              value={latestStockPrice}
              options={{
                currency: holdingCurrency,
                maximumFractionDigits: 2,
              }}
            />
          </p>
        </div>
      )}
    </>
  );
}
