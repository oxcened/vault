import { DataTable } from "../ui/data-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DataTableColumns } from "../ui/data-table-columns";
import { AddTransactionDropdown } from "../add-transaction-dropdown";
import { DataTablePagination } from "../ui/data-table-pagination";
import { transactionColumns } from "./config";
import { api } from "~/trpc/react";
import { useState } from "react";
import { TableSkeleton } from "../table-skeleton";
import { keepPreviousData } from "@tanstack/react-query";
import { Input } from "../ui/input";
import { useDebouncedCallback } from "use-debounce";

export function TransactionTable() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [query, setQuery] = useState("");
  const handleSearch = useDebouncedCallback((value: string) => {
    setQuery(value);
    setPagination((state) => ({ ...state, pageIndex: 0 }));
  }, 1000);

  const { data, isPending } = api.transaction.getAll.useQuery(
    {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      sortOrder: "desc",
      sortField: "timestamp",
      includeTotal: true,
      query,
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns: transactionColumns,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: data?.totalPages ?? 1,
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
        <Input
          placeholder="Search transactions..."
          className="flex-1"
          onChange={(e) => handleSearch(e.target.value)}
        />
        <DataTableColumns table={table} />
        <AddTransactionDropdown onSuccess={handleCreated} />
      </div>

      {isPending ? <TableSkeleton /> : <DataTable table={table} />}
      <DataTablePagination table={table} />
    </div>
  );
}
