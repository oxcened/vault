import { DataTable } from "../ui/data-table";
import { getCoreRowModel, SortingState } from "@tanstack/react-table";
import { DataTableColumns } from "../ui/data-table-columns";
import { AddTransactionDropdown } from "../add-transaction-dropdown";
import { DataTablePagination } from "../ui/data-table-pagination";
import { transactionColumns } from "./config";
import { api } from "~/trpc/react";
import { useRef, useState } from "react";
import { TableSkeleton } from "../table-skeleton";
import { keepPreviousData } from "@tanstack/react-query";
import { Input } from "../ui/input";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "../ui/button";
import { FilterIcon, XIcon } from "lucide-react";
import { useTable } from "~/hooks/useTable";
import { type TransactionStatus, TransactionType } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "~/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { SortField } from "~/server/api/routers/transaction";

type Tab = TransactionStatus | "OVERDUE";

export function TransactionTable() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value);
    setPagination((state) => ({ ...state, pageIndex: 0 }));
  }, 1000);

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = "";
    setDebouncedQuery("");
    setPagination((state) => ({ ...state, pageIndex: 0 }));
  };

  const [filters, setFilters] = useState<{
    types: TransactionType[];
    status: Tab;
  }>({
    types: Object.values(TransactionType),
    status: "POSTED",
  });

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "timestamp",
      desc: true,
    },
  ]);

  const { data, isPending } = api.transaction.getAll.useQuery(
    {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      sortOrder: sorting[0]?.desc ? "desc" : "asc",
      sortField: (sorting[0]?.id as SortField) ?? "timestamp",
      includeTotal: true,
      query: debouncedQuery,
      types: filters.types,
      statuses: [
        (
          {
            POSTED: "POSTED",
            PLANNED: "PLANNED",
            OVERDUE: "PLANNED",
          } as const
        )[filters.status],
      ],
      timestampTo: filters.status === "OVERDUE" ? new Date() : undefined,
      timestampFrom: filters.status === "PLANNED" ? new Date() : undefined,
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const table = useTable({
    data: data?.items ?? [],
    columns: transactionColumns,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: data?.totalPages ?? 1,
    meta: {
      id: "transactions",
    },
    initialState: {
      columnVisibility: {
        type: false,
      },
    },
    onSortingChange: setSorting,
    enableSorting: true,
  });

  const utils = api.useUtils();

  const handleCreated = () => {
    void utils.transaction.getAll.invalidate();
    void utils.cashFlow.getMonthlyCashFlow.invalidate();
    void utils.cashFlow.getAll.invalidate();
    void utils.dashboard.getSummary.invalidate();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 md:flex-row">
        <Tabs
          className="mr-auto"
          value={filters.status}
          onValueChange={(value) => {
            setFilters({ ...filters, status: value as Tab });
            setSorting([
              {
                id: "timestamp",
                desc: value === "POSTED",
              },
            ]);
          }}
        >
          <TabsList>
            <TabsTrigger value={"POSTED" satisfies Tab}>Posted</TabsTrigger>
            <TabsTrigger value={"PLANNED" satisfies Tab}>Upcoming</TabsTrigger>
            <TabsTrigger value={"OVERDUE" satisfies Tab}>Overdue</TabsTrigger>
          </TabsList>
        </Tabs>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" onClick={handleClear}>
              <FilterIcon />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Type</DropdownMenuLabel>
            {Object.values(TransactionType).map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={filters.types?.includes(type)}
                className="capitalize"
                onCheckedChange={(checked) =>
                  setFilters((filters) => ({
                    ...filters,
                    types: checked
                      ? new Set([...filters.types, type]).values().toArray()
                      : filters.types.filter(
                          (filterType) => filterType !== type,
                        ),
                  }))
                }
              >
                {type.toLocaleLowerCase()}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DataTableColumns table={table} />

        <AddTransactionDropdown onSuccess={handleCreated} />
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder="Search transactions..."
            onChange={(e) => search(e.target.value)}
          />

          {debouncedQuery && (
            <Button
              type="button"
              className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
              size="icon"
              variant="ghost"
              onClick={handleClear}
            >
              <XIcon />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      </div>

      {isPending ? <TableSkeleton /> : <DataTable table={table} />}
      <DataTablePagination table={table} />
    </div>
  );
}
