"use client";

import { CalculatorIcon } from "lucide-react";
import { Input } from "~/components/ui/input";
import { MonthPicker } from "~/components/ui/month-picker";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { yupResolver } from "@hookform/resolvers/yup";
import { forwardRef, useImperativeHandle } from "react";
import { safeEvaluate } from "~/utils/number";
import {
  type CreateQuantity,
  createQuantitySchema,
} from "~/trpc/schemas/netWorthAsset";
import { useParams } from "next/navigation";
import { toMonthTimestamp } from "~/utils/date";

export type QuantityFormRef = { reset: () => void };

export type QuantityFormProps = {
  initialData?: CreateQuantity;
  formId?: string;
  onSubmit: (data: CreateQuantity) => void;
};

const QuantityForm = forwardRef<QuantityFormRef, QuantityFormProps>(function (
  { initialData, formId, onSubmit },
  ref,
) {
  const { assetId } = useParams();

  const form = useForm({
    defaultValues: initialData ?? {
      quantity: "",
      timestamp: toMonthTimestamp(new Date()),
      assetId: (Array.isArray(assetId) ? assetId[0] : assetId) ?? "",
    },
    resolver: yupResolver(createQuantitySchema),
  });

  useImperativeHandle(ref, () => ({
    reset: form.reset,
  }));

  return (
    <Form {...form}>
      <form
        id={formId}
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity or value</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="Quantity or value" {...field} />
                    <CalculatorIcon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
                  </div>
                </FormControl>
                <FormDescription>
                  {safeEvaluate(field.value)
                    ? "Result: " + safeEvaluate(field.value)
                    : "You can enter values as a formula, e.g. 1000 + 500."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timestamp"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Month</FormLabel>
                <FormControl>
                  <MonthPicker
                    value={field.value}
                    maxMonth={toMonthTimestamp(new Date())}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Each month can have one valuation. Edit the existing entry to
                  change it.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
});

QuantityForm.displayName = "QuantityForm";
export default QuantityForm;
