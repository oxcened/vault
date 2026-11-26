"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import type { RecurringTransactionInput } from "~/trpc/schemas/recurring-transaction";
import { RecurringTransactionForm } from "./RecurringTransactionForm";
import type { TransactionType } from "@prisma/client";

type RecurringTransactionDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: RecurringTransactionInput;
  scheduleId?: string;
  type?: TransactionType;
};

const formId = "recurring-transaction-form";

export function RecurringTransactionDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
  scheduleId,
  type,
}: RecurringTransactionDialogProps) {
  const create = api.recurringTransaction.create.useMutation({
    onSuccess: () => handleSuccess("Schedule created."),
  });
  const update = api.recurringTransaction.update.useMutation({
    onSuccess: () => handleSuccess("Schedule updated."),
  });
  const transactionType = type ?? initialData?.type;

  const handleSuccess = (message: string) => {
    toast.success(message);
    onSuccess();
    onOpenChange(false);
  };
  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {scheduleId
              ? "Edit schedule"
              : transactionType === "INCOME"
                ? "Add income schedule"
                : "Add expense schedule"}
          </DialogTitle>
          <DialogDescription>
            {scheduleId
              ? initialData?.frequency === "ONCE"
                ? "Changes apply to this scheduled transaction."
                : "Changes apply to future occurrences."
              : "Choose when to record it and whether it should repeat."}
          </DialogDescription>
        </DialogHeader>
        <RecurringTransactionForm
          formId={formId}
          initialData={initialData}
          type={transactionType}
          onSubmit={(data) =>
            scheduleId
              ? update.mutate({ id: scheduleId, ...data })
              : create.mutate(data)
          }
        />
        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Save schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
