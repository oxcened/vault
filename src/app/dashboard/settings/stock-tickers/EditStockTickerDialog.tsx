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
import { StockTicker } from "@prisma/client";
import { StockTickerForm } from "./StockTickerForm";

export type EditStockTickerDialogProps = {
  stockTicker?: StockTicker;
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function EditStockTickerDialog({
  stockTicker,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditStockTickerDialogProps) {
  const { mutate, isPending } = api.stockTicker.update.useMutation({
    onSuccess: () => {
      toast.success("Stock ticker updated.");
      onSuccess();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit stock ticker</DialogTitle>
        </DialogHeader>
        <StockTickerForm
          formId="edit-stock-ticker-dialog-form"
          initialData={stockTicker}
          onSubmit={(data) =>
            stockTicker?.id && mutate({ ...data, id: stockTicker.id })
          }
        />
        <DialogFooter>
          <Button
            type="submit"
            disabled={isPending}
            form="edit-stock-ticker-dialog-form"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
