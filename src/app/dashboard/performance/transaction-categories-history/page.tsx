"use client";

import { useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { getCoreRowModel } from "@tanstack/react-table";
import { api } from "~/trpc/react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
import { DataTable } from "~/components/ui/data-table";
import { DataTableColumns } from "~/components/ui/data-table-columns";
import { useTable } from "~/hooks/useTable";
import { Calendar } from "~/components/ui/calendar";
import { transactionCategoryColumns } from "./config";
import { DateTime } from "luxon";

const today = DateTime.now();

export default function TransactionCategoriesPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: today.startOf("month").startOf("day").toJSDate(),
    to: today.endOf("month").endOf("day").toJSDate(),
  });

  const rangeLabel = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return null;
    }

    const formatter = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    });
    const [from, to] =
      dateRange.from <= dateRange.to
        ? [dateRange.from, dateRange.to]
        : [dateRange.to, dateRange.from];

    return `${formatter.format(from)} – ${formatter.format(to)}`;
  }, [dateRange]);

  const { data = [], isPending } = api.transaction.aggregateByCategory.useQuery(
    {
      fromDate: dateRange.from!,
      toDate: dateRange.to!,
    },
    {
      enabled: Boolean(dateRange),
      placeholderData: (previousData) => previousData,
      meta: {
        persist: false,
      },
    },
  );

  const incomeData = useMemo(
    () => data.filter((row) => row.categoryType === "INCOME"),
    [data],
  );
  const expenseData = useMemo(
    () => data.filter((row) => row.categoryType === "EXPENSE"),
    [data],
  );

  const incomeTable = useTable({
    data: incomeData,
    columns: transactionCategoryColumns,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      columnVisibility: {
        transactionCount: false,
      },
    },
    meta: {
      id: "transactionCategoryAggregatesIncome",
    },
  });

  const expenseTable = useTable({
    data: expenseData,
    columns: transactionCategoryColumns,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      columnVisibility: {
        transactionCount: false,
      },
    },
    meta: {
      id: "transactionCategoryAggregatesExpense",
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
              <BreadcrumbPage>Transaction categories history</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-screen-lg flex-col gap-5 p-5">
        <div className="flex justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={cn(
                  "font-normal",
                  !(dateRange?.from && dateRange?.to) &&
                    "text-muted-foreground",
                )}
              >
                {rangeLabel ?? <span>Pick a date</span>}

                <CalendarIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                selected={dateRange}
                defaultMonth={dateRange.from}
                onSelect={(date) => setDateRange((oldDate) => date ?? oldDate)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {isPending ? (
          <TableSkeleton />
        ) : (
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Income</h2>
                <DataTableColumns table={incomeTable} />
              </div>
              <DataTable table={incomeTable} />
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Expenses</h2>
                <DataTableColumns table={expenseTable} />
              </div>
              <DataTable table={expenseTable} />
            </section>
          </div>
        )}
      </div>
    </>
  );
}
