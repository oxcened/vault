import { DataTable } from "../ui/data-table";
import { getCoreRowModel } from "@tanstack/react-table";
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
import { XIcon } from "lucide-react";
import { useTable } from "~/hooks/useTable";

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

  const { data, isPending } = api.transaction.getAll.useQuery(
    {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      sortOrder: "desc",
      sortField: "timestamp",
      includeTotal: true,
      query: debouncedQuery,
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const table = useTable({
    data: data?.items ?? [],
    columns: transactionColumns,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: data?.totalPages ?? 1,
    meta: {
      id: "transactions",
    },
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
        <DataTableColumns table={table} />
        <AddTransactionDropdown onSuccess={handleCreated} />
      </div>

      {isPending ? <TableSkeleton /> : <DataTable table={table} />}
      <DataTablePagination table={table} />
    </div>
  );
}
