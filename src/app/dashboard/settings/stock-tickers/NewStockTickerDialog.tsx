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
import { StockTickerForm } from "./StockTickerForm";

export default function NewStockTickerDialog({
  isOpen,
  onSuccess,
  onOpenChange,
}: {
  isOpen: boolean;
  onSuccess: () => void;
  onOpenChange: (newOpen: boolean) => void;
}) {
  const { mutate, isPending } = api.stockTicker.create.useMutation({
    onSuccess: () => {
      toast.success("Stock ticker created.");
      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add stock ticker</DialogTitle>
        </DialogHeader>
        <StockTickerForm
          formId="new-stock-ticker-dialog-form"
          onSubmit={mutate}
        />
        <DialogFooter>
          <Button
            type="submit"
            disabled={isPending}
            form="new-stock-ticker-dialog-form"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
