"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { api, RouterInputs } from "~/trpc/react";
import { toast } from "sonner";

type Form = RouterInputs["exchangeRate"]["update"];

export type EditExchangeRateDialogProps = {
  initialData?: Form;
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function EditExchangeRateDialog({
  initialData,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditExchangeRateDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    defaultValues: initialData,
  });

  const { mutate, isPending } = api.exchangeRate.update.useMutation({
    onSuccess: () => {
      toast.success("Exchange rate updated.");
      onSuccess();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Exchange Rate</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => mutate(data))}
          className="space-y-4"
        >
          <div className="flex flex-col gap-2">
            <Input placeholder="Base Currency" {...register("baseCurrency")} />
            <Input
              placeholder="Quote Currency"
              {...register("quoteCurrency")}
            />
            <Input
              placeholder="Rate"
              type="number"
              step="any"
              {...register("rate", { valueAsNumber: true })}
            />
            {errors.rate && (
              <p className="text-xs text-red-500">{errors.rate.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
