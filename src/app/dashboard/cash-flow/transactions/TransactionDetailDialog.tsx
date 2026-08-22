"use client";

import {
  TransactionActions,
  type TransactionRow,
} from "~/components/transactionTable/config";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Currency } from "~/components/ui/number";
import { cn } from "~/lib/utils";
import { formatDate } from "~/utils/date";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  CalendarDays,
  Coins,
  Pencil,
  RotateCcw,
  Tag,
} from "lucide-react";

export type TransactionDetailDialogProps = {
  transaction?: TransactionRow;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (transaction: TransactionRow) => void;
};

export function TransactionDetailDialog({
  transaction,
  isOpen,
  onOpenChange,
  onEdit,
}: TransactionDetailDialogProps) {
  if (!transaction) return null;

  const displayAmount = transaction.amount.mul(
    transaction.type === "EXPENSE" ? -1 : 1,
  );
  const isRefund = transaction.type === "EXPENSE" && transaction.amount.isNeg();
  const isExpense = transaction.type === "EXPENSE" && !isRefund;
  const isIncome = transaction.type === "INCOME";
  const AmountIcon = isRefund
    ? RotateCcw
    : isExpense
      ? ArrowUpRight
      : isIncome
        ? ArrowDownLeft
        : ArrowRightLeft;
  const amountLabel = isRefund
    ? "Refund"
    : isExpense
      ? "Money out"
      : isIncome
        ? "Money in"
        : "Transfer";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        <div className="space-y-5 p-6">
          <DialogHeader className="pr-8">
            <div className="min-w-0 space-y-1.5 text-left">
              <DialogTitle className="truncate leading-tight">
                {transaction.description}
              </DialogTitle>
              {transaction.status !== "POSTED" && (
                <Badge variant="secondary" className="capitalize">
                  {transaction.status.toLowerCase()}
                </Badge>
              )}
            </div>
            <DialogDescription className="sr-only">
              Transaction details
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  (isRefund || isIncome) &&
                    "bg-emerald-500/10 text-financial-positive",
                  isExpense && "bg-red-500/10 text-financial-negative",
                  transaction.type === "TRANSFER" &&
                    "bg-muted text-muted-foreground",
                )}
              >
                <AmountIcon className="size-4" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {amountLabel}
              </p>
            </div>
            <Currency
              value={displayAmount}
              options={{
                currency: transaction.currency,
                signDisplay: "always",
              }}
              className={cn(
                "text-xl font-semibold tracking-tight",
                displayAmount.isPos() && "text-financial-positive",
                displayAmount.isNeg() && "text-financial-negative",
              )}
            />
          </div>

          <dl className="overflow-hidden rounded-xl border text-sm">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Tag className="size-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Category</dt>
              <dd className="ml-auto font-medium">
                {transaction.category.name}
              </dd>
            </div>
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <CalendarDays className="size-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Date</dt>
              <dd className="ml-auto text-right font-medium">
                {formatDate({
                  date: transaction.timestamp,
                  options: { dateStyle: "medium", timeStyle: "short" },
                })}
              </dd>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <Coins className="size-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Currency</dt>
              <dd className="ml-auto font-medium">
                {transaction.currency.toUpperCase()}
              </dd>
            </div>
          </dl>
        </div>

        <DialogFooter className="flex-row justify-end gap-2 border-t bg-muted/20 px-6 py-4">
          <TransactionActions
            transaction={transaction}
            showEdit={false}
            showTriggerLabel
            onDeleted={() => onOpenChange(false)}
          />
          <Button
            onClick={() => {
              onOpenChange(false);
              onEdit(transaction);
            }}
          >
            <Pencil />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
