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
import { ExchangeRateDialogForm } from "./ExchangeRateDialogForm";

export default function NewExchangeRateDialog({
  isOpen,
  onSuccess,
  onOpenChange,
  defaultBaseCurrency,
  defaultQuoteCurrency,
}: {
  isOpen: boolean;
  onSuccess: () => void;
  onOpenChange: (newOpen: boolean) => void;
  defaultBaseCurrency?: string;
  defaultQuoteCurrency?: string;
}) {
  const { mutate, isPending } = api.exchangeRate.create.useMutation({
    onSuccess: () => {
      toast.success("Exchange rate created.");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add exchange rate</DialogTitle>
        </DialogHeader>
        <ExchangeRateDialogForm
          formId="new-exchange-rate-dialog-form"
          defaultBaseCurrency={defaultBaseCurrency}
          defaultQuoteCurrency={defaultQuoteCurrency}
          onSubmit={mutate}
        />
        <DialogFooter>
          <Button
            type="submit"
            disabled={isPending}
            form="new-exchange-rate-dialog-form"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
