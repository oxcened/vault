"use client";

import type { RecurrenceFrequency } from "@prisma/client";
import type { RecurringTransactionRow } from "~/components/transactionTable/recurring-transaction-list";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Currency } from "~/components/ui/number";
import { cn } from "~/lib/utils";
import {
  CalendarClock,
  CalendarCheck,
  Coins,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Repeat2,
  SkipForward,
  Tag,
  Trash2,
  Zap,
  RotateCcw,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
} from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";

const frequencyLabels: Record<RecurrenceFrequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function formatRecurrence(schedule: RecurringTransactionRow) {
  if (schedule.interval === 1) return frequencyLabels[schedule.frequency];

  const unit = {
    DAILY: "days",
    WEEKLY: "weeks",
    MONTHLY: "months",
    YEARLY: "years",
  }[schedule.frequency];
  return `Every ${schedule.interval} ${unit}`;
}

type RecurringTransactionDetailDialogProps = {
  schedule?: RecurringTransactionRow;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (schedule: RecurringTransactionRow) => void;
  onRecord: () => void;
  onRecordNow: () => void;
  onSkip: () => void;
  onTogglePaused: () => void;
  onDelete: () => void;
  isRecording: boolean;
};

export function RecurringTransactionDetailDialog({
  schedule,
  isOpen,
  onOpenChange,
  onEdit,
  onRecord,
  onRecordNow,
  onSkip,
  onTogglePaused,
  onDelete,
  isRecording,
}: RecurringTransactionDetailDialogProps) {
  if (!schedule) return null;

  const displayAmount = schedule.amount.mul(
    schedule.type === "EXPENSE" ? -1 : 1,
  );
   const isRefund = schedule.type === "EXPENSE" && schedule.amount.isNeg();
  const isExpense = schedule.type === "EXPENSE" && !isRefund;
  const isIncome = schedule.type === "INCOME";
  const AmountIcon = isRefund
    ? RotateCcw
    : isExpense
      ? ArrowUpRight
      : isIncome
        ? ArrowDownLeft
        : ArrowRightLeft;
  const amountLabel =
    schedule.type === "EXPENSE"
      ? "Money out"
      : schedule.type === "INCOME"
        ? "Money in"
        : "Transfer";
  const daysUntil = differenceInCalendarDays(schedule.nextDate, new Date());
  const recordLabel =
    daysUntil < 0
      ? `Record for ${format(schedule.nextDate, "d MMM")}`
      : "Record now";
  const RecordIcon = daysUntil < 0 ? CalendarCheck : Zap;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        <div className="space-y-5 p-6">
          <DialogHeader className="pr-8">
            <div className="min-w-0 space-y-1.5 text-left">
              <DialogTitle className="truncate leading-tight">
                {schedule.description}
              </DialogTitle>
              {schedule.isPaused && <Badge variant="secondary">Paused</Badge>}
            </div>
            <DialogDescription className="sr-only">
              Scheduled transaction details
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-2"><div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  (isRefund || isIncome) &&
                    "bg-emerald-500/10 text-financial-positive",
                  isExpense && "bg-red-500/10 text-financial-negative",
                  schedule.type === "TRANSFER" &&
                    "bg-muted text-muted-foreground",
                )}
              >
                <AmountIcon className="size-4" />
              </div>
            <p className="text-sm font-medium text-muted-foreground">
              {amountLabel}
            </p></div>
            
            <Currency
              value={displayAmount}
              options={{ currency: schedule.currency, signDisplay: "always" }}
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
              <dd className="ml-auto font-medium">{schedule.category.name}</dd>
            </div>
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <CalendarClock className="size-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Next occurrence</dt>
              <dd className="ml-auto text-right font-medium">
                {format(schedule.nextDate, "d MMM yyyy")}
              </dd>
            </div>
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Repeat2 className="size-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Repeats</dt>
              <dd className="ml-auto font-medium">
                {formatRecurrence(schedule)}
              </dd>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <Coins className="size-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Currency</dt>
              <dd className="ml-auto font-medium">
                {schedule.currency.toUpperCase()}
              </dd>
            </div>
          </dl>
        </div>

        <DialogFooter className="flex-row justify-end gap-2 border-t bg-muted/20 px-6 py-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal />
                <span className="sr-only">Schedule actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {daysUntil < 0 && !schedule.isPaused && (
                <DropdownMenuItem onClick={onRecordNow}>
                  <Zap /> Record now
                </DropdownMenuItem>
              )}
              {!schedule.isPaused && (
                <DropdownMenuItem onClick={onSkip}>
                  <SkipForward /> Skip occurrence
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onTogglePaused}>
                {schedule.isPaused ? <Play /> : <Pause />}
                {schedule.isPaused ? "Resume" : "Pause"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500" onClick={onDelete}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {!schedule.isPaused && (
            <Button variant="outline" onClick={onRecord} disabled={isRecording}>
              <RecordIcon /> {recordLabel}
            </Button>
          )}
          <Button
            onClick={() => {
              onOpenChange(false);
              onEdit(schedule);
            }}
          >
            <Pencil /> Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
