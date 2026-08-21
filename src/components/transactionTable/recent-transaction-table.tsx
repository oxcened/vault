import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { formatDate } from "~/utils/date";
import { buttonVariants } from "../ui/button";
import { Currency } from "../ui/number";
import { Skeleton } from "../ui/skeleton";
import type { TransactionRow } from "./config";
import { TransactionIcon } from "./transaction-icon";

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
  return (
    <section
      aria-labelledby="recent-transactions-heading"
      className={className}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 id="recent-transactions-heading" className="text-sm font-medium">
          Recent transactions
        </h2>
        <Link
          href="/dashboard/cash-flow/transactions"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          See all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {isPending &&
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
            >
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}

        {!isPending && transactions.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No transactions yet.
          </p>
        )}

        {!isPending &&
          transactions.map((transaction) => {
            const displayAmount = transaction.amount.mul(
              transaction.type === "EXPENSE" ? -1 : 1,
            );
            const isRefund =
              transaction.type === "EXPENSE" && transaction.amount.isNeg();

            return (
              <Link
                key={transaction.id}
                href="/dashboard/cash-flow/transactions"
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40"
              >
                <TransactionIcon
                  category={transaction.category.name}
                  type={transaction.type}
                  isRefund={isRefund}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {transaction.description}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {transaction.category.name} ·{" "}
                    {formatDate({
                      date: transaction.timestamp,
                      options: { month: "short", day: "numeric" },
                    })}
                  </span>
                </span>
                <Currency
                  value={displayAmount}
                  options={{
                    currency: transaction.currency,
                    signDisplay: "always",
                  }}
                  className={cn(
                    "text-sm",
                    displayAmount.isPos() && "text-financial-positive",
                    displayAmount.isNeg() && "text-financial-negative",
                  )}
                />
              </Link>
            );
          })}
      </div>
    </section>
  );
}
