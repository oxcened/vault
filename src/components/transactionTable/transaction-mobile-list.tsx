import { Currency } from "~/components/ui/number";
import { cn } from "~/lib/utils";
import { formatDate } from "~/utils/date";
import type { TransactionRow } from "./config";
import { TransactionIcon } from "./transaction-icon";
import { Checkbox } from "../ui/checkbox";

type TransactionMobileListProps = {
  transactions: TransactionRow[];
  onTransactionClick: (transaction: TransactionRow) => void;
  selectedIds?: string[];
  onSelectedChange?: (id: string, selected: boolean) => void;
  allSelected?: boolean;
  someSelected?: boolean;
  onToggleAll?: (selected: boolean) => void;
};

export function TransactionMobileList({
  transactions,
  onTransactionClick,
  selectedIds = [],
  onSelectedChange,
  allSelected = false,
  someSelected = false,
  onToggleAll,
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
      {(onToggleAll !== undefined || onSelectedChange !== undefined) && (
        <div className="hidden items-center gap-3 border-b bg-muted/40 px-3 py-2 md:flex">
          <span className="flex min-w-9 min-h-5 shrink-0 items-center justify-center">
            <Checkbox
              checked={allSelected || (someSelected && "indeterminate")}
              onCheckedChange={(checked) => onToggleAll?.(checked === true)}
              aria-label="Select all transactions on this page"
            />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : "Select all"}
          </span>
        </div>
      )}
      {transactions.map((transaction) => {
        const displayAmount = transaction.amount.mul(
          transaction.type === "EXPENSE" ? -1 : 1,
        );
        const isRefund =
          transaction.type === "EXPENSE" && transaction.amount.isNeg();
        const isSelected = selectedIds.includes(transaction.id);

        return (
          <div
            key={transaction.id}
            className="flex w-full items-center gap-3 border-b px-3 py-3 transition-colors last:border-b-0 hover:bg-muted/50 active:bg-muted"
          >
            {onSelectedChange && (
              <div className="group/transaction-select relative size-9 shrink-0">
                <div
                  className={cn(
                    "transition-opacity md:group-hover/transaction-select:opacity-0",
                    isSelected && "opacity-0",
                  )}
                >
                  <TransactionIcon
                    category={transaction.category.name}
                    type={transaction.type}
                    isRefund={isRefund}
                  />
                </div>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    onSelectedChange(transaction.id, checked === true)
                  }
                  className={cn(
                    "absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity focus-visible:opacity-100 md:flex md:group-hover/transaction-select:opacity-100",
                    isSelected && "md:opacity-100",
                  )}
                  aria-label={`Select ${transaction.description}`}
                />
              </div>
            )}

            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              onClick={() => onTransactionClick(transaction)}
              aria-label={`View ${transaction.description}`}
            >
              {!onSelectedChange && (
                <TransactionIcon
                  category={transaction.category.name}
                  type={transaction.type}
                  isRefund={isRefund}
                />
              )}

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
          </div>
        );
      })}
    </div>
  );
}
