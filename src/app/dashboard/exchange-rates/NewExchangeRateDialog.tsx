"use client";

import { useState } from "react";
import { Controller, ControllerRenderProps, useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api, RouterInputs } from "~/trpc/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { twJoin } from "tailwind-merge";
import { localTimeToUTCTime } from "~/utils/date";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { Calendar } from "~/components/ui/calendar";
import { toast } from "sonner";

type Form = RouterInputs["exchangeRate"]["create"];

export default function NewExchangeRateDialog({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const { mutate, isPending } = api.exchangeRate.create.useMutation({
    onSuccess: () => {
      toast.success("Exchange rate created.");
      setOpen(false);
      onSuccess();
    },
  });

  const { register, handleSubmit, reset, control } = useForm<Form>({
    defaultValues: {
      baseCurrency: "",
      quoteCurrency: "",
      timestamp: new Date(),
    },
  });
  const [isOpen, setOpen] = useState(false);

  function handleSelectDate(field: ControllerRenderProps<Form>, date?: Date) {
    if (!date) return;
    field.onChange(localTimeToUTCTime({ date }));
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setOpen(open);
        if (open) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <Plus />
          New exchange rate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={handleSubmit((data) => mutate(data))}
          className="flex flex-col gap-5"
        >
          <DialogHeader>
            <DialogTitle>New exchange rate</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Base Currency (e.g., USD)"
              {...register("baseCurrency", { required: true })}
            />
            <Input
              placeholder="Quote Currency (e.g., EUR)"
              {...register("quoteCurrency", { required: true })}
            />
            <Input
              placeholder="Rate"
              type="number"
              step="any"
              {...register("rate", { required: true, valueAsNumber: true })}
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
