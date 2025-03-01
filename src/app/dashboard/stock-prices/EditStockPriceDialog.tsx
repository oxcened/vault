"use client";

import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Loader2 } from "lucide-react";
import { api, RouterInputs } from "~/trpc/react";
import { StockPriceHistory } from "@prisma/client";
import { toast } from "sonner";

type Form = RouterInputs["stockPrice"]["update"]; // expects at least { id: string, price: number }

export type EditStockPriceDialogProps = {
  initialData: StockPriceHistory; // includes id, tickerId, price, timestamp, etc.
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditStockPriceDialog({
  initialData,
  onClose,
  onSuccess,
}: EditStockPriceDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    defaultValues: {
      id: initialData.id,
      price: initialData.price.toNumber(),
    },
  });

  const { mutate, isPending } = api.stockPrice.update.useMutation({
    onSuccess: () => {
      toast.success("Stock price updated.");
      onSuccess();
      onClose();
    },
  });

  const onSubmit = (data: Form) => {
    mutate(data);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Stock Price</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-2">
            {/* Display ticker as read-only */}
            <Input
              placeholder="Ticker ID"
              value={initialData.tickerId}
              disabled
              className="cursor-not-allowed"
            />
            <Input
              placeholder="Price"
              type="number"
              step="any"
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="text-xs text-red-500">{errors.price.message}</p>
            )}
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
