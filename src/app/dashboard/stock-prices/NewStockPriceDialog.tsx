"use client";

import { Controller, ControllerRenderProps, useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Calendar } from "~/components/ui/calendar";
import { Input } from "~/components/ui/input";
import { CalendarIcon, Loader2 } from "lucide-react";
import { api, RouterInputs } from "~/trpc/react";
import { Popover, PopoverContent } from "~/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { twJoin } from "tailwind-merge";
import { localTimeToUTCTime } from "~/utils/date";
import { toast } from "sonner";
import { useEffect } from "react";

type Form = RouterInputs["stockPrice"]["create"];

export type NewStockPriceDialogProps = {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
};

export default function NewStockPriceDialog({
  isOpen,
  onSuccess,
  onClose,
}: NewStockPriceDialogProps) {
  const { register, handleSubmit, reset, control } = useForm<Form>();

  const { mutate, isPending } = api.stockPrice.create.useMutation({
    onSuccess: () => {
      toast.success("Stock price created.");
      reset();
      onSuccess();
      onClose();
    },
  });

  function handleSelectDate(field: ControllerRenderProps<Form>, date?: Date) {
    if (!date) return;
    field.onChange(localTimeToUTCTime({ date }));
  }

  useEffect(() => {
    if (!isOpen) return;
    reset();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Stock Price</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((data) => mutate(data))}
        >
          <Input
            placeholder="Ticker ID"
            {...register("tickerId", { required: true })}
          />
          <Input
            placeholder="Price"
            type="number"
            step="any"
            {...register("price", { required: true, valueAsNumber: true })}
          />
          <Controller
            name="timestamp"
            control={control}
            rules={{
              required: true,
            }}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={twJoin(
                      "pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {field.value ? (
                      field.value.toLocaleDateString()
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => handleSelectDate(field, date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
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
