"use client";

import { Loader2 } from "lucide-react";
import { useRef } from "react";
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
import TransactionForm, { type TransactionFormRef } from "./TransactionForm";
import { type CreateTransaction } from "~/trpc/schemas/transaction";

export type NewTransactionDialogProps = {
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
  initialData?: CreateTransaction;
  title?: string;
};

export default function NewTransactionDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
  title = "Add transaction",
}: NewTransactionDialogProps) {
  const createMoreRef = useRef(false);
  const formRef = useRef<TransactionFormRef>(null);
  const { mutate, isPending } = api.transaction.create.useMutation({
    onSuccess: () => {
      toast.success("Transaction created.");
      if (createMoreRef.current) {
        formRef.current?.reset();
      } else {
        onOpenChange(false);
      }
      createMoreRef.current = false;
      onSuccess();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        onEscapeKeyDown={(event) => {
          const activeElement = document.activeElement;
          if (activeElement?.getAttribute("aria-expanded") === "true") {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <TransactionForm
          ref={formRef}
          formId="new-transaction-dialog-form"
          initialData={initialData}
          onSubmit={mutate}
        />
        <DialogFooter className="gap-2">
          <Button
            type="submit"
            disabled={isPending}
            form="new-transaction-dialog-form"
            className="sm:order-2"
            onClick={() => {
              createMoreRef.current = false;
            }}
          >
            {isPending && !createMoreRef.current && (
              <Loader2 className="animate-spin" />
            )}
            Save
          </Button>
          {!initialData && (
            <Button
              type="submit"
              variant="outline"
              disabled={isPending}
              form="new-transaction-dialog-form"
              className="sm:order-1"
              onClick={() => {
                createMoreRef.current = true;
              }}
            >
              {isPending && createMoreRef.current && (
                <Loader2 className="animate-spin" />
              )}
              Save and add another
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
