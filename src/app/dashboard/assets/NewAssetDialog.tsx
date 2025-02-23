"use client";

import { Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
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
import { Controller, useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { evaluate } from "mathjs";

type Form = RouterInputs["netWorthAsset"]["create"] & {
  quantityFormula?: string;
};

export type NewAssetDialogProps = {
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function NewAssetDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: NewAssetDialogProps) {
  const [closeOnSubmit, setCloseOnSubmit] = useState(true);
  const { mutate, isPending } = api.netWorthAsset.create.useMutation({
    onSuccess: () => {
      if (closeOnSubmit) {
        onOpenChange(false);
      } else {
        reset();
      }
      onSuccess();
    },
  });
  const { register, handleSubmit, control, watch, setValue, reset } =
    useForm<Form>({
      defaultValues: {
        type: "",
      },
    });

  const [isFormulaValid, setFormulaValid] = useState(true);
  const watchType = watch("type");
  const quantityFormulaValue = watch("quantityFormula");

  // Evaluate the quantity formula on the fly without showing errors.
  useEffect(() => {
    if (!quantityFormulaValue?.trim()) return;

    try {
      const computed = evaluate(quantityFormulaValue);
      if (isNaN(computed)) return;

      setValue("initialQuantity", Number(computed), {
        shouldValidate: true,
      });

      setFormulaValid(true);
    } catch {
      // Silently ignore errors while the user is typing.
      setFormulaValid(false);
    }
  }, [quantityFormulaValue, setValue]);

  useEffect(() => {
    if (!isOpen) return;
    reset();
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={handleSubmit((data) => mutate(data))}
          className="flex flex-col gap-5"
        >
          <DialogHeader>
            <DialogTitle>New asset</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Controller
              name="type"
              control={control}
              rules={{
                required: true,
              }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">Accounts</SelectItem>
                    <SelectItem value="stock">Stocks</SelectItem>
                    <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Input
              placeholder="Name"
              {...register("name", { required: true })}
            />

            {watchType !== "stock" && (
              <>
                <Input
                  placeholder="Initial Quantity/Value"
                  type="number"
                  step="any"
                  {...register("initialQuantity", {
                    valueAsNumber: true,
                    required: true,
                  })}
                />
                <Input
                  placeholder="Quantity Formula (optional)"
                  {...register("quantityFormula", {
                    validate: (value) => !value || isFormulaValid,
                  })}
                />
              </>
            )}

            {watchType === "stock" && (
              <>
                <Input
                  placeholder="Ticker"
                  {...register("ticker", { required: true })}
                />
                <Input
                  placeholder="Exchange"
                  {...register("exchange", { required: true })}
                />
                <Input
                  placeholder="Stock name"
                  {...register("stockName", { required: true })}
                />
                <Input
                  placeholder="Quantity"
                  type="number"
                  step="any"
                  {...register("initialQuantity", {
                    valueAsNumber: true,
                    required: true,
                  })}
                />
                <Input
                  placeholder="Quantity Formula (optional)"
                  {...register("quantityFormula")}
                />
              </>
            )}

            <Input
              placeholder="Currency (e.g., USD, EUR, BTC)"
              {...register("currency", { required: true })}
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending}
              onClick={() => setCloseOnSubmit(true)}
            >
              {isPending && closeOnSubmit && (
                <Loader2 className="animate-spin" />
              )}
              Save
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={isPending}
              onClick={() => setCloseOnSubmit(false)}
            >
              {isPending && !closeOnSubmit && (
                <Loader2 className="animate-spin" />
              )}
              Save & Add Another
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
