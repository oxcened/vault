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

type RecurringTransactionDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: RecurringTransactionInput;
  scheduleId?: string;
};

const formId = "recurring-transaction-form";

export function RecurringTransactionDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
  scheduleId,
}: RecurringTransactionDialogProps) {
  const create = api.recurringTransaction.create.useMutation({
    onSuccess: () => handleSuccess("Schedule created."),
  });
  const update = api.recurringTransaction.update.useMutation({
    onSuccess: () => handleSuccess("Schedule updated."),
  });

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
            {scheduleId ? "Edit schedule" : "Add schedule"}
          </DialogTitle>
          <DialogDescription>
            {scheduleId
              ? "Changes apply to future occurrences."
              : "Set it once, then record each occurrence when it happens."}
          </DialogDescription>
        </DialogHeader>
        <RecurringTransactionForm
          formId={formId}
          initialData={initialData}
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
