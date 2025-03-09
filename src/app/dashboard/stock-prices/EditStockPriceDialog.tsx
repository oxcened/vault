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
import { useEffect } from "react";

type Form = RouterInputs["stockPrice"]["update"];

export type EditStockPriceDialogProps = {
  isOpen: boolean;
  initialData?: StockPriceHistory;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function EditStockPriceDialog({
  isOpen,
  initialData,
  onOpenChange,
  onSuccess,
}: EditStockPriceDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    defaultValues: {
      id: initialData?.id,
      price: initialData?.price.toNumber(),
    },
  });

  const { mutate, isPending } = api.stockPrice.update.useMutation({
    onSuccess: () => {
      toast.success("Stock price updated.");
      onSuccess();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Stock Price</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => mutate(data))}
          className="space-y-4"
        >
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Ticker ID"
              value={initialData?.tickerId || "N/A"}
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
