"use client";

import { type Prisma } from "@prisma/client";
import { lastDayOfMonth } from "date-fns";
import { FilterIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { TableSkeleton } from "~/components/table-skeleton";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MonthPicker } from "~/components/ui/month-picker";
import { RoundedCurrency } from "~/components/ui/number";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { DECIMAL_ZERO } from "~/utils/number";
import { getCoreRowModel } from "@tanstack/react-table";
import { holdingHistoryColumns } from "./config";
import { DataTable } from "../ui/data-table";
import { DataTableColumns } from "../ui/data-table-columns";
import { useTable } from "~/hooks/useTable";

export type NetWorthHoldingsHistoryRow = {
  id: string;
  name: string;
  categoryName: string | null;
  value: Prisma.Decimal;
};

export type NetWorthHoldingsHistoryProps = {
  data: NetWorthHoldingsHistoryRow[];
  isFetching: boolean;
  date: Date;
  type: "asset" | "debt";
  onDateChange: (date: Date) => void;
};

export default function NetWorthHoldingsHistory({
  data = [],
  isFetching,
  date,
  type,
  onDateChange,
}: NetWorthHoldingsHistoryProps) {
  const [hideZeroItems, setHideZeroItems] = useState(true);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (!hideZeroItems) return true;
      return !row.value.eq(DECIMAL_ZERO);
    });
  }, [data, hideZeroItems]);

  const total = filteredData.reduce(
    (prev, curr) => prev.plus(curr.value),
    DECIMAL_ZERO,
  );

  const table = useTable({
    data: filteredData,
    columns: holdingHistoryColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      id: `netWorthHoldingHistory${type === "asset" ? "Assets" : "Debts"}`,
    },
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DashboardBreadcrumb
          items={[
            {
              label: type === "asset" ? "Assets" : "Debts",
              href: `/dashboard/${type === "asset" ? "assets" : "debts"}`,
            },
            { label: `${type === "asset" ? "Assets" : "Debts"} history` },
          ]}
        />
      </header>

      <div className="mx-auto flex w-full max-w-screen-lg flex-col gap-5 p-5">
        {isFetching ? (
          <TableSkeleton />
        ) : (
          <>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="mr-auto">
                <p className="text-sm text-muted-foreground">
                  {type === "asset" ? "Assets" : "Debts"}
                </p>
                <RoundedCurrency
                  value={total}
                  className="text-3xl font-semibold"
                />
              </div>

              <div className="flex flex-wrap gap-2 [&>*]:flex-1">
                <DataTableColumns table={table} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <FilterIcon />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      Filter {type === "asset" ? "assets" : "debts"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={hideZeroItems}
                      onCheckedChange={setHideZeroItems}
                    >
                      Hide zero {type === "asset" ? "assets" : "debts"}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <MonthPicker
                  value={date}
                  maxMonth={new Date()}
                  className="w-auto"
                  onChange={(date) => onDateChange(lastDayOfMonth(date))}
                />
              </div>
            </div>

            <DataTable table={table} />
          </>
        )}
      </div>
    </>
  );
}
