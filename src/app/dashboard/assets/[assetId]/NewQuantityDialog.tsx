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
import QuantityForm, { type QuantityFormRef } from "./QuantityForm";

export type NewQuantityDialogProps = {
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function NewQuantityDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: NewQuantityDialogProps) {
  const formRef = useRef<QuantityFormRef>(null);
  const { mutate, isPending } = api.netWorthAsset.createQuantity.useMutation({
    onSuccess: () => {
      toast.success("Monthly valuation saved.");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add monthly valuation</DialogTitle>
        </DialogHeader>
        <QuantityForm
          ref={formRef}
          formId="new-quantity-dialog-form"
          onSubmit={(data) => mutate(data)}
        />
        <DialogFooter>
          <Button
            type="submit"
            disabled={isPending}
            form="new-quantity-dialog-form"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
