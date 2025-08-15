"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StockPriceDialogForm } from "./StockPriceDialogForm";

export default function NewStockPriceDialog({
  isOpen,
  onSuccess,
  onOpenChange,
}: {
  isOpen: boolean;
  onSuccess: () => void;
  onOpenChange: (newOpen: boolean) => void;
}) {
  const { mutate, isPending } = api.stockPrice.create.useMutation({
    onSuccess: () => {
      toast.success("Stock price created.");
      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add stock price</DialogTitle>
        </DialogHeader>
        <StockPriceDialogForm
          formId="new-stock-price-dialog-form"
          onSubmit={mutate}
        />
        <DialogFooter>
          <Button
            type="submit"
            disabled={isPending}
            form="new-stock-price-dialog-form"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
