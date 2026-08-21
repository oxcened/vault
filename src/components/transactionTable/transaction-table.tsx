import { DataTable } from "../ui/data-table";
import { getCoreRowModel, type SortingState } from "@tanstack/react-table";
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
import { TransactionStatus, TransactionType } from "@prisma/client";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import type { SortField } from "~/server/api/routers/transaction";
import { TransactionFiltersDialog } from "./transaction-filters-dialog";
import type { TransactionFilters as DialogTransactionFilters } from "./transaction-filters-form";
import { type TransactionRow } from "./config";
import { TransactionDetailDialog } from "~/app/dashboard/cash-flow/transactions/TransactionDetailDialog";
import EditTransactionDialog from "~/app/dashboard/cash-flow/transactions/EditTransactionDialog";
import { TransactionMobileList } from "./transaction-mobile-list";
import { Skeleton } from "../ui/skeleton";
import { RecurringTransactionList } from "./recurring-transaction-list";

type View = "TRANSACTIONS" | "SCHEDULED";

export function TransactionTable() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [detailTransaction, setDetailTransaction] = useState<TransactionRow>();
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionRow>();
  const [view, setView] = useState<View>("TRANSACTIONS");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: schedules = [] } = api.recurringTransaction.getAll.useQuery();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = schedules.filter(
    (schedule) => !schedule.isPaused && schedule.nextDate < today,
  ).length;

  const search = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value);
    setPagination((state) => ({ ...state, pageIndex: 0 }));
  }, 1000);

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = "";
    setDebouncedQuery("");
    setPagination((state) => ({ ...state, pageIndex: 0 }));
  };

  const [filters, setFilters] = useState<DialogTransactionFilters>({
    types: Object.values(TransactionType),
    categories: [],
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
      statuses: [TransactionStatus.POSTED],
      timestampTo: filters.dateRange?.to,
      timestampFrom: filters.dateRange?.from,
      categoryIds: filters.categories,
    },
    {
      placeholderData: keepPreviousData,
      enabled: view === "TRANSACTIONS",
      meta: {
        persist: false,
      },
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
        status: false,
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
    void utils.recurringTransaction.getAll.invalidate();
  };

  const handleFilterDialogSubmit = (newFilters: DialogTransactionFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 md:flex-row">
        <Tabs
          className="mr-auto"
          value={view}
          onValueChange={(value) => setView(value as View)}
        >
          <TabsList>
            <TabsTrigger value={"TRANSACTIONS" satisfies View}>
              Transactions
            </TabsTrigger>
            <TabsTrigger value={"SCHEDULED" satisfies View}>
              Scheduled
              {overdueCount > 0 && (
                <span className="ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] leading-none text-destructive-foreground">
                  {overdueCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-2 [&>*]:flex-1">
          {view === "TRANSACTIONS" && (
            <TransactionFiltersDialog
              defaultValues={filters}
              onSubmit={handleFilterDialogSubmit}
              showDateRangeFilter
            />
          )}

          {view === "TRANSACTIONS" && (
            <div className="hidden md:block">
              <DataTableColumns table={table} />
            </div>
          )}

          <AddTransactionDropdown onSuccess={handleCreated} />
        </div>
      </div>

      {view === "TRANSACTIONS" && (
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
      )}

      {view === "SCHEDULED" ? (
        <RecurringTransactionList />
      ) : isPending ? (
        <>
          <div className="overflow-hidden rounded-xl border md:hidden">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b px-3 py-3 last:border-b-0"
              >
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="ml-auto h-4 w-16" />
                  <Skeleton className="ml-auto h-3 w-10" />
                </div>
              </div>
            ))}
          </div>
          <TableSkeleton className="hidden md:table" />
        </>
      ) : (
        <>
          <div className="md:hidden">
            <TransactionMobileList
              transactions={data?.items ?? []}
              onTransactionClick={setDetailTransaction}
            />
          </div>
          <div className="hidden md:block">
            <DataTable table={table} onRowClick={setDetailTransaction} />
          </div>
        </>
      )}
      {view === "TRANSACTIONS" && <DataTablePagination table={table} />}

      <TransactionDetailDialog
        transaction={detailTransaction}
        isOpen={!!detailTransaction}
        onOpenChange={(open) => {
          if (!open) setDetailTransaction(undefined);
        }}
        onEdit={(transaction) => setEditingTransaction(transaction)}
      />

      <EditTransactionDialog
        key={`table-edit-transaction-dialog-${editingTransaction?.id ?? "closed"}`}
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onOpenChange={(open) => {
          if (!open) setEditingTransaction(undefined);
        }}
        onSuccess={handleCreated}
      />
    </div>
  );
}
