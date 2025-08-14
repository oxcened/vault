"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { type StockPriceHistory } from "@prisma/client";
import { type CreateStockPrice } from "~/trpc/schemas/stockPrice";
import { StockPriceDialogForm } from "./StockPriceDialogForm";

export type EditStockPriceDialogProps = {
  stockPrice?: StockPriceHistory;
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function EditStockPriceDialog({
  stockPrice,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditStockPriceDialogProps) {
  const { mutate, isPending } = api.stockPrice.update.useMutation({
    onSuccess: () => {
      toast.success("Stock price updated.");
      onSuccess();
      onOpenChange(false);
    },
  });

  const initialData: CreateStockPrice | undefined = stockPrice
    ? {
        ...stockPrice,
        price: stockPrice.price.toNumber(),
      }
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit stock price</DialogTitle>
        </DialogHeader>
        <StockPriceDialogForm
          formId="edit-exchange-rate-dialog-form"
          initialData={initialData}
          onSubmit={(data) =>
            stockPrice?.id && mutate({ ...data, id: stockPrice.id })
          }
        />
        <DialogFooter>
          <Button
            type="submit"
            disabled={isPending}
            form="edit-exchange-rate-dialog-form"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
