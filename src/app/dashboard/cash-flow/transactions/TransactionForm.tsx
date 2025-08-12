"use client";

import { CalendarIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
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
import { APP_CURRENCY } from "~/constants";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  type CreateTransaction,
  createTransactionSchema,
} from "~/trpc/schemas/transaction";
import { TransactionType } from "@prisma/client";
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

export type TransactionFormRef = { reset: () => void };

export type TransactionFormProps = {
  initialData?: CreateTransaction;
  formId?: string;
  onSubmit: (data: CreateTransaction) => void;
};

const TransactionForm = forwardRef<TransactionFormRef, TransactionFormProps>(
  function ({ initialData, formId, onSubmit }, ref) {
    const form = useForm({
      defaultValues: initialData ?? {
        currency: APP_CURRENCY,
        categoryId: "",
        description: "",
        timestamp: new Date(),
        type: "" as TransactionType,
      },
      resolver: yupResolver(createTransactionSchema),
    });

    const watchType = form.watch("type");

    const { data: categories = [], isPending: isFetchingCategories } =
      api.transactionCategory.getByType.useQuery(
        {
          type: [watchType],
        },
        {
          enabled: !!watchType,
        },
      );

    useImperativeHandle(ref, () => ({
      reset: form.reset,
    }));

    return (
      <Form {...form}>
        <form
          id={formId}
          className="grid grid-cols-1 gap-2 md:grid-cols-3"
          onSubmit={form.handleSubmit(onSubmit)}
        >
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
                    {Object.values(TransactionType).map((type) => (
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

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Amount"
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

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Category</FormLabel>

                <Select
                  value={field.value}
                  disabled={isFetchingCategories}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger isLoading={isFetchingCategories}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timestamp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl className="w-full">
                      <Button
                        variant="outline"
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
                      disabled={(date) => date > new Date()}
                      initialFocus
                      defaultMonth={field.value}
                      onSelect={(date) =>
                        date &&
                        field.onChange(mergeDateAndTime(date, field.value))
                      }
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
        </form>
      </Form>
    );
  },
);

TransactionForm.displayName = "TransactionForm";
export default TransactionForm;
