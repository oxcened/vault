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

export function TransactionTable() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const { data, isPending } = api.transaction.getAll.useQuery(
    {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      sortOrder: "desc",
      sortField: "timestamp",
      includeTotal: true,
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
      <div className="flex justify-end gap-2">
        <DataTableColumns table={table} />
        <AddTransactionDropdown onSuccess={handleCreated} />
      </div>

      {isPending ? <TableSkeleton /> : <DataTable table={table} />}
      <DataTablePagination table={table} />
    </div>
  );
}
