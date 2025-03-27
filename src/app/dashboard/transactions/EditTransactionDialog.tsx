"use client";

import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import TransactionForm from "./TransactionForm";
import { CreateTransaction } from "~/trpc/schemas/transaction";
import { Prisma, TransactionType } from "@prisma/client";

export type EditTransactionDialogProps = {
  transaction?: {
    amount: Prisma.Decimal;
    type: TransactionType;
    timestamp: Date;
    description: string;
    currency: string;
    categoryId: string;
  };
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function EditTransactionDialog({
  transaction,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditTransactionDialogProps) {
  const { mutate, isPending } = api.transaction.update.useMutation({
    onSuccess: () => {
      toast.success("Transaction updated.");
      onSuccess();
      onOpenChange(false);
    },
  });

  const initialData: CreateTransaction | undefined = transaction
    ? {
        amount: transaction.amount.toNumber(),
        type: transaction.type,
        categoryId: transaction.categoryId,
        currency: transaction.currency,
        description: transaction.description,
        timestamp: transaction.timestamp,
      }
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
        </DialogHeader>
        <TransactionForm
          formId="edit-transaction-dialog-form"
          initialData={initialData}
          onSubmit={(data) =>
            transaction && mutate({ ...data, id: transaction.id })
          }
        />
        <DialogFooter className="gap-2">
          <Button
            type="submit"
            disabled={isPending}
            form="edit-transaction-dialog-form"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
