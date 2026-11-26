"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { RecurrenceFrequency, TransactionType } from "@prisma/client";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { AmountInput } from "~/components/ui/amount-input";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { TransactionIcon } from "~/components/transactionTable/transaction-icon";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { APP_CURRENCY } from "~/constants";
import { api } from "~/trpc/react";
import {
  recurringTransactionSchema,
  type RecurringTransactionInput,
} from "~/trpc/schemas/recurring-transaction";
import { getCurrencyFractionDigits } from "~/utils/currency";
import { cn } from "~/lib/utils";

type RecurringTransactionFormProps = {
  formId: string;
  initialData?: RecurringTransactionInput;
  type?: TransactionType;
  onSubmit: (data: RecurringTransactionInput) => void;
};

const frequencyUnits: Record<RecurrenceFrequency, string> = {
  ONCE: "Does not repeat",
  DAILY: "day",
  WEEKLY: "week",
  MONTHLY: "month",
  YEARLY: "year",
};

export function RecurringTransactionForm({
  formId,
  initialData,
  type,
  onSubmit,
}: RecurringTransactionFormProps) {
  const form = useForm<RecurringTransactionInput>({
    defaultValues: initialData ?? {
      amount: undefined,
      categoryId: "",
      currency: APP_CURRENCY,
      description: "",
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      nextDate: new Date(),
      type: type ?? TransactionType.EXPENSE,
    },
    resolver: yupResolver(recurringTransactionSchema),
  });
  const watchedType = form.watch("type");
  const currency = form.watch("currency");
  const interval = form.watch("interval");
  const frequency = form.watch("frequency");
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const { data: categories = [], isPending } =
    api.transactionCategory.getByType.useQuery({ type: [watchedType] });

  return (
    <Form {...form}>
      <form
        id={formId}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <AmountInput
                  ref={field.ref}
                  name={field.name}
                  value={field.value ?? ""}
                  onBlur={field.onBlur}
                  onValueChange={field.onChange}
                  currencyAction={
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-7 items-center gap-1 rounded px-1.5 text-xs font-medium uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Change currency, currently ${currency}`}
                        >
                          {currency}
                          <ChevronDown className="size-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-3" align="end">
                        <div className="space-y-2">
                          <label
                            htmlFor={`${formId}-currency`}
                            className="text-sm font-medium"
                          >
                            Currency
                          </label>
                          <Input
                            id={`${formId}-currency`}
                            placeholder="EUR"
                            autoCapitalize="characters"
                            aria-invalid={!!form.formState.errors.currency}
                            {...form.register("currency")}
                          />
                          {form.formState.errors.currency?.message && (
                            <p className="text-sm font-medium text-destructive">
                              {form.formState.errors.currency.message}
                            </p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  }
                  maxFractionDigits={getCurrencyFractionDigits(currency)}
                  placeholder="0.00"
                  autoFocus
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
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Rent" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Category</FormLabel>
              <Select
                value={field.value}
                disabled={isPending}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger isLoading={isPending}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        <TransactionIcon
                          category={category.name}
                          type={watchedType}
                          size="sm"
                        />
                        {category.name}
                      </span>
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
          name="nextDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next date</FormLabel>
              <Popover open={isDatePickerOpen} onOpenChange={setDatePickerOpen}>
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
                      <CalendarIcon className="ml-auto size-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="single"
                    selected={field.value}
                    defaultMonth={field.value}
                    onSelect={(date) => {
                      if (!date) return;
                      field.onChange(date);
                      setDatePickerOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Repeat</FormLabel>
          <div className="mt-2 flex gap-2">
            {frequency !== RecurrenceFrequency.ONCE && (
              <FormField
                control={form.control}
                name="interval"
                render={({ field }) => (
                  <FormItem className="w-20">
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        max={99}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(RecurrenceFrequency).map((frequency) => (
                        <SelectItem key={frequency} value={frequency}>
                          {frequency === RecurrenceFrequency.ONCE
                            ? frequencyUnits[frequency]
                            : `${frequencyUnits[frequency]}${
                                interval === 1 ? "" : "s"
                              }`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
}
