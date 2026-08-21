import { Currency } from "~/components/ui/number";
import { cn } from "~/lib/utils";
import { formatDate } from "~/utils/date";
import type { TransactionRow } from "./config";
import { TransactionIcon } from "./transaction-icon";

type TransactionMobileListProps = {
  transactions: TransactionRow[];
  onTransactionClick: (transaction: TransactionRow) => void;
};

export function TransactionMobileList({
  transactions,
  onTransactionClick,
}: TransactionMobileListProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border px-4 py-12 text-center text-sm text-muted-foreground">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {transactions.map((transaction) => {
        const displayAmount = transaction.amount.mul(
          transaction.type === "EXPENSE" ? -1 : 1,
        );
        const isRefund =
          transaction.type === "EXPENSE" && transaction.amount.isNeg();

        return (
          <button
            key={transaction.id}
            type="button"
            className="flex w-full items-center gap-3 border-b px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50 active:bg-muted"
            onClick={() => onTransactionClick(transaction)}
            aria-label={`View ${transaction.description}`}
          >
            <TransactionIcon
              category={transaction.category.name}
              type={transaction.type}
              isRefund={isRefund}
            />

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {transaction.description}
              </span>
              <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <span className="truncate">{transaction.category.name}</span>
                {transaction.status !== "POSTED" && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">
                      {transaction.status.toLowerCase()}
                    </span>
                  </>
                )}
              </span>
            </span>

            <span className="shrink-0 text-right">
              <Currency
                value={displayAmount}
                options={{
                  currency: transaction.currency,
                  signDisplay: "always",
                }}
                className={cn(
                  "block text-sm",
                  displayAmount.isPos() && "text-financial-positive",
                  displayAmount.isNeg() && "text-financial-negative",
                )}
              />
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {formatDate({
                  date: transaction.timestamp,
                  options: { month: "short", day: "numeric" },
                })}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
