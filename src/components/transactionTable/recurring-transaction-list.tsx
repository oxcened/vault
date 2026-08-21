"use client";

import type {
  Prisma,
  RecurrenceFrequency,
  TransactionType,
} from "@prisma/client";
import { differenceInCalendarDays, format } from "date-fns";
import {
  CalendarClock,
  Check,
  ChevronDown,
  Loader2,
  Pause,
  Pencil,
  Play,
  SkipForward,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RecurringTransactionDialog } from "~/app/dashboard/cash-flow/transactions/RecurringTransactionDialog";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Currency } from "~/components/ui/number";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { RecurringTransactionInput } from "~/trpc/schemas/recurring-transaction";
import { TransactionIcon } from "./transaction-icon";

export type RecurringTransactionRow = {
  id: string;
  amount: Prisma.Decimal;
  currency: string;
  description: string;
  type: TransactionType;
  categoryId: string;
  category: { name: string };
  nextDate: Date;
  frequency: RecurrenceFrequency;
  interval: number;
  isPaused: boolean;
};

const frequencyLabels: Record<RecurrenceFrequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function RecurringTransactionList() {
  const utils = api.useUtils();
  const { data: schedules = [], isPending } =
    api.recurringTransaction.getAll.useQuery();
  const refresh = () => {
    void utils.recurringTransaction.getAll.invalidate();
  };
  const post = api.recurringTransaction.post.useMutation({
    onSuccess: () => {
      toast.success("Transaction posted.");
      refresh();
      void utils.transaction.getAll.invalidate();
      void utils.cashFlow.getMonthlyCashFlow.invalidate();
      void utils.cashFlow.getAll.invalidate();
      void utils.dashboard.getSummary.invalidate();
    },
  });

  if (isPending) return <ScheduleSkeleton />;
  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
          <CalendarClock className="size-5 text-muted-foreground" />
        </span>
        <p className="font-medium">No scheduled transactions yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Add a schedule or turn an existing transaction into one.
        </p>
      </div>
    );
  }

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const needsAttention = schedules.filter(
    (schedule) => !schedule.isPaused && schedule.nextDate <= endOfToday,
  );
  const comingUp = schedules.filter(
    (schedule) => !schedule.isPaused && schedule.nextDate > endOfToday,
  );
  const paused = schedules.filter((schedule) => schedule.isPaused);

  return (
    <div className="space-y-5">
      <ScheduleSection
        title="Needs attention"
        schedules={needsAttention}
        onPost={(id) => post.mutate({ id })}
        postingId={post.isPending ? post.variables?.id : undefined}
        onChanged={refresh}
        urgent
      />
      <ScheduleSection
        title="Coming up"
        schedules={comingUp}
        onPost={(id) => post.mutate({ id })}
        postingId={post.isPending ? post.variables?.id : undefined}
        onChanged={refresh}
      />
      <ScheduleSection
        title="Paused"
        schedules={paused}
        onPost={(id) => post.mutate({ id })}
        postingId={post.isPending ? post.variables?.id : undefined}
        onChanged={refresh}
      />
    </div>
  );
}

function ScheduleSection({
  title,
  schedules,
  onPost,
  postingId,
  onChanged,
  urgent = false,
}: {
  title: string;
  schedules: RecurringTransactionRow[];
  onPost: (id: string) => void;
  postingId?: string;
  onChanged: () => void;
  urgent?: boolean;
}) {
  if (schedules.length === 0) return null;

  return (
    <section>
      <div className="mb-2 flex items-center gap-2 px-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant={urgent ? "destructive" : "secondary"}>
          {schedules.length}
        </Badge>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        {schedules.map((schedule) => (
          <ScheduleRow
            key={schedule.id}
            schedule={schedule}
            onPost={() => onPost(schedule.id)}
            isPosting={postingId === schedule.id}
            onChanged={onChanged}
          />
        ))}
      </div>
    </section>
  );
}

function ScheduleRow({
  schedule,
  onPost,
  isPosting,
  onChanged,
}: {
  schedule: RecurringTransactionRow;
  onPost: () => void;
  isPosting: boolean;
  onChanged: () => void;
}) {
  const [isEditing, setEditing] = useState(false);
  const utils = api.useUtils();
  const { confirm, modal } = useConfirmDelete();
  const skip = api.recurringTransaction.skip.useMutation({
    onSuccess: () => {
      toast.success("Occurrence skipped.");
      onChanged();
    },
  });
  const setPaused = api.recurringTransaction.setPaused.useMutation({
    onSuccess: onChanged,
  });
  const remove = api.recurringTransaction.delete.useMutation({
    onSuccess: () => {
      toast.success("Schedule deleted.");
      onChanged();
    },
  });
  const input: RecurringTransactionInput = {
    amount: schedule.amount.toNumber(),
    categoryId: schedule.categoryId,
    currency: schedule.currency,
    description: schedule.description,
    frequency: schedule.frequency,
    interval: schedule.interval,
    nextDate: schedule.nextDate,
    type: schedule.type,
  };
  const displayAmount = schedule.amount.mul(
    schedule.type === "EXPENSE" ? -1 : 1,
  );
  const daysUntil = differenceInCalendarDays(schedule.nextDate, new Date());
  const dateLabel = schedule.isPaused
    ? `Next ${format(schedule.nextDate, "d MMM")}`
    : daysUntil < 0
      ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"} overdue`
      : daysUntil === 0
        ? "Due today"
        : `Next ${format(schedule.nextDate, "d MMM")}`;

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b px-3 py-3 last:border-b-0 sm:px-4",
        schedule.isPaused && "opacity-60",
      )}
    >
      <TransactionIcon category={schedule.category.name} type={schedule.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{schedule.description}</p>
        <p className="truncate text-xs text-muted-foreground">
          {dateLabel} · {formatRecurrence(schedule)}
        </p>
      </div>
      <Currency
        value={displayAmount}
        options={{ currency: schedule.currency, signDisplay: "always" }}
        className={cn(
          "hidden shrink-0 text-sm sm:block",
          displayAmount.isPos() && "text-financial-positive",
          displayAmount.isNeg() && "text-financial-negative",
        )}
      />
      <TooltipProvider>
        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:block">
          <Currency
            value={displayAmount}
            options={{ currency: schedule.currency, signDisplay: "always" }}
            className={cn(
              "text-xs tabular-nums sm:hidden",
              displayAmount.isPos() && "text-financial-positive",
              displayAmount.isNeg() && "text-financial-negative",
            )}
          />
          <div className="flex">
            {!schedule.isPaused && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="size-8 rounded-r-none"
                    onClick={onPost}
                    disabled={isPosting}
                  >
                    {isPosting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Check />
                    )}
                    <span className="sr-only">Record now</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Record now</TooltipContent>
              </Tooltip>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={schedule.isPaused ? "outline" : "default"}
                  size="icon"
                  className={cn(
                    "size-8 shrink-0",
                    !schedule.isPaused &&
                      "rounded-l-none border-l border-primary-foreground/20",
                  )}
                >
                  <ChevronDown />
                  <span className="sr-only">Schedule actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil /> Edit schedule
                </DropdownMenuItem>
                {!schedule.isPaused && (
                  <DropdownMenuItem
                    onClick={() => skip.mutate({ id: schedule.id })}
                  >
                    <SkipForward /> Skip occurrence
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() =>
                    setPaused.mutate({
                      id: schedule.id,
                      isPaused: !schedule.isPaused,
                    })
                  }
                >
                  {schedule.isPaused ? <Play /> : <Pause />}
                  {schedule.isPaused ? "Resume" : "Pause"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() =>
                    confirm({
                      itemType: "schedule",
                      itemName: schedule.description,
                      onConfirm: () => remove.mutate({ id: schedule.id }),
                    })
                  }
                >
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </TooltipProvider>
      {modal}
      <RecurringTransactionDialog
        key={`edit-schedule-${schedule.id}-${isEditing}`}
        isOpen={isEditing}
        onOpenChange={setEditing}
        onSuccess={() => {
          void utils.recurringTransaction.getAll.invalidate();
        }}
        scheduleId={schedule.id}
        initialData={input}
      />
    </div>
  );
}

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

function ScheduleSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border p-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-2">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
