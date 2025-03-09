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
import { CreateExchangeRate } from "~/trpc/schemas/exchangeRate";
import { ExchangeRateDialogForm } from "./ExchangeRateDialogForm";
import { ExchangeRate } from "@prisma/client";

export type EditExchangeRateDialogProps = {
  exchangeRate?: ExchangeRate;
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function EditExchangeRateDialog({
  exchangeRate,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditExchangeRateDialogProps) {
  const { mutate, isPending } = api.exchangeRate.update.useMutation({
    onSuccess: () => {
      toast.success("Exchange rate updated.");
      onSuccess();
      onOpenChange(false);
    },
  });

  const initialData: CreateExchangeRate | undefined = exchangeRate
    ? {
        ...exchangeRate,
        rate: exchangeRate.rate.toNumber(),
      }
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Exchange Rate</DialogTitle>
        </DialogHeader>
        <ExchangeRateDialogForm
          formId="edit-exchange-rate-dialog-form"
          initialData={initialData}
          onSubmit={(data) =>
            exchangeRate?.id && mutate({ ...data, id: exchangeRate.id })
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
