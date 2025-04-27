"use client";

import { CalculatorIcon, CalendarIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { cn } from "~/lib/utils";
import { forwardRef, useImperativeHandle } from "react";
import { TimePicker } from "~/components/ui/time-picker";
import { mergeDateAndTime } from "~/utils/date";
import { safeEvaluate } from "~/utils/number";
import {
  CreateQuantity,
  createQuantitySchema,
} from "~/trpc/schemas/netWorthAsset";
import { useParams } from "next/navigation";

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
      timestamp: new Date(),
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
                <FormLabel>Initial quantity/value</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="Initial quantity/value" {...field} />
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
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
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
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) =>
                        date &&
                        field.onChange(mergeDateAndTime(date, field.value))
                      }
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                    <div className="border-t border-border p-3">
                      <TimePicker date={field.value} setDate={field.onChange} />
                    </div>
                  </PopoverContent>
                </Popover>
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
