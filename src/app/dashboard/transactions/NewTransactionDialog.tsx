"use client";

import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import TransactionForm, { type TransactionFormRef } from "./TransactionForm";

export type NewTransactionDialogProps = {
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function NewTransactionDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: NewTransactionDialogProps) {
  const [createMore, setCreateMore] = useState(false);
  const formRef = useRef<TransactionFormRef>(null);
  const { mutate, isPending } = api.transaction.create.useMutation({
    onSuccess: () => {
      toast.success("Transaction created.");
      if (createMore) {
        formRef.current?.reset();
      } else {
        onOpenChange(false);
      }
      onSuccess();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New transaction</DialogTitle>
        </DialogHeader>
        <TransactionForm
          ref={formRef}
          formId="new-transaction-dialog-form"
          onSubmit={mutate}
        />
        <DialogFooter className="gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="airplane-mode"
              onCheckedChange={(checked) => setCreateMore(checked)}
            />
            <Label htmlFor="airplane-mode">Create more</Label>
          </div>
          <Button
            type="submit"
            disabled={isPending}
            form="new-transaction-dialog-form"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
