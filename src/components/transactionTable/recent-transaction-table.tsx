import { DataTable } from "../ui/data-table";
import { getCoreRowModel } from "@tanstack/react-table";
import { baseTransactionColumns, type TransactionRow } from "./config";
import { TableSkeleton } from "../table-skeleton";
import { cn } from "~/lib/utils";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "../ui/button";
import Link from "next/link";
import { useTable } from "~/hooks/useTable";

export type TransactionTableProps = {
  className?: string;
  transactions?: TransactionRow[];
  isPending?: boolean;
};

export function RecentTransactionTable({
  className,
  transactions = [],
  isPending,
}: TransactionTableProps) {
  const table = useTable({
    data: transactions,
    columns: baseTransactionColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <p className="font-medium">Recent transactions</p>
        <Link
          href="/dashboard/cash-flow/transactions"
          className={cn(
            buttonVariants({
              variant: "ghost",
            }),
          )}
        >
          See all
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <div
        className={cn(
          "flex flex-col gap-2 [&_td]:px-6 [&_td]:py-3 [&_th]:px-6 [&_th]:py-3",
        )}
      >
        {isPending ? (
          <TableSkeleton />
        ) : (
          <DataTable table={table} className="rounded-xl" />
        )}
      </div>
    </div>
  );
}
