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
import QuantityForm from "./QuantityForm";
import { type CreateQuantity } from "~/trpc/schemas/netWorthAsset";
import type Decimal from "decimal.js";

export type EditQuantityDialogProps = {
  quantity?: {
    id: string;
    quantity: Decimal;
    quantityFormula: string | null;
    netWorthAssetId: string;
    timestamp: Date;
  };
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function EditQuantityDialog({
  quantity,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditQuantityDialogProps) {
  const { mutate, isPending } = api.netWorthAsset.updateQuantity.useMutation({
    onSuccess: () => {
      toast.success("Quantity updated.");
      onSuccess();
      onOpenChange(false);
    },
  });

  const initialData: CreateQuantity | undefined = quantity
    ? {
        assetId: quantity.netWorthAssetId,
        quantity: quantity.quantityFormula ?? quantity.quantity.toString(),
        timestamp: quantity.timestamp,
      }
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit quantity</DialogTitle>
        </DialogHeader>
        <QuantityForm
          formId="edit-quantity-dialog-form"
          initialData={initialData}
          onSubmit={(data) => quantity && mutate({ ...data, id: quantity.id })}
        />
        <DialogFooter className="gap-2">
          <Button
            type="submit"
            disabled={isPending}
            form="edit-quantity-dialog-form"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
