"use client";

import { type Prisma } from "@prisma/client";
import { format, lastDayOfMonth } from "date-fns";
import { CalendarIcon, FilterIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { TableSkeleton } from "~/components/table-skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "~/components/ui/breadcrumb";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
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
  }, [data]);

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
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard/net-worth">
                Performance & History
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {type === "asset" ? "Assets" : "Debts"} history
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      "font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    {date ? (
                      format(date, "MMMM yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}

                    <CalendarIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <MonthPicker
                    value={date}
                    disabled={(date) => date > new Date()}
                    onChange={(date) => onDateChange(lastDayOfMonth(date))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <DataTable table={table} />
          </>
        )}
      </div>
    </>
  );
}
