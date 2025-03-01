"use client";

import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { evaluate } from "mathjs";
import { APP_CURRENCY, DEBT_TYPES, OTHER_TYPE } from "~/constants";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { yupResolver } from "@hookform/resolvers/yup";
import { createNetWorthDebtSchema } from "~/trpc/schemas/netWorthDebt";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

export type NewDebtDialogProps = {
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function NewDebtDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: NewDebtDialogProps) {
  const [createMore, setCreateMore] = useState(false);
  const { mutate, isPending } = api.netWorthDebt.create.useMutation({
    onSuccess: () => {
      if (createMore) {
        form.reset();
      } else {
        onOpenChange(false);
      }
      onSuccess();
    },
  });
  const form = useForm({
    defaultValues: {
      type: "",
      currency: APP_CURRENCY,
      customType: "",
      name: "",
      quantityFormula: "",
    },
    resolver: yupResolver(createNetWorthDebtSchema),
  });

  const watchType = form.watch("type");
  const [isFormulaValid, setFormulaValid] = useState(true);
  const quantityFormulaValue = form.watch("quantityFormula");

  // Evaluate the quantity formula on the fly without showing errors.
  useEffect(() => {
    if (!quantityFormulaValue?.trim()) return;

    try {
      const computed = evaluate(quantityFormulaValue);
      if (isNaN(computed)) return;

      form.setValue("initialQuantity", Number(computed), {
        shouldValidate: true,
      });
      setFormulaValid(true);
    } catch {
      // Silently ignore errors while the user is typing.
      setFormulaValid(false);
    }
  }, [quantityFormulaValue, form.setValue]);

  useEffect(() => {
    if (!isOpen) return;
    form.reset();
  }, [isOpen, form.reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="flex flex-col gap-5"
          >
            <DialogHeader>
              <DialogTitle>New Debt</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>

                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEBT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchType === OTHER_TYPE && (
                <FormField
                  control={form.control}
                  name="customType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom type</FormLabel>
                      <FormControl>
                        <Input placeholder="Custom type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial quantity/value</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Initial quantity/value"
                        type="number"
                        step="any"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantityFormula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity formula (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Quantity formula (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Currency (e.g., USD, EUR, BTC)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <div className="flex items-center space-x-2">
                <Switch
                  id="airplane-mode"
                  onCheckedChange={(checked) => setCreateMore(checked)}
                />
                <Label htmlFor="airplane-mode">Create more</Label>
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
