"use client";

import { type TransactionRow } from "~/components/transactionTable/config";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
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
            <div className="flex items-start gap-3 text-left">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  (isRefund || isIncome) &&
                    "bg-emerald-500/10 text-financial-positive",
                  isExpense && "bg-red-500/10 text-financial-negative",
                  transaction.type === "TRANSFER" &&
                    "bg-muted text-muted-foreground",
                )}
              >
                <AmountIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <DialogTitle className="truncate leading-tight">
                  {transaction.description}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {isRefund ? "refund" : transaction.type.toLowerCase()}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {transaction.status.toLowerCase()}
                  </Badge>
                </div>
              </div>
            </div>
            <DialogDescription className="sr-only">
              Transaction details
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {amountLabel}
            </p>
            <Currency
              value={displayAmount}
              options={{
                currency: transaction.currency,
                signDisplay: "always",
              }}
              className={cn(
                "text-3xl font-semibold tracking-tight",
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

        <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
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
