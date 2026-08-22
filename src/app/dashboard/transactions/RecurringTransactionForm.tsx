"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { RecurrenceFrequency, TransactionType } from "@prisma/client";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { AmountInput } from "~/components/ui/amount-input";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
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
  onSubmit: (data: RecurringTransactionInput) => void;
};

const frequencyUnits: Record<
  RecurrenceFrequency,
  { singular: string; plural: string }
> = {
  DAILY: { singular: "day", plural: "days" },
  WEEKLY: { singular: "week", plural: "weeks" },
  MONTHLY: { singular: "month", plural: "months" },
  YEARLY: { singular: "year", plural: "years" },
};

export function RecurringTransactionForm({
  formId,
  initialData,
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
      type: TransactionType.EXPENSE,
    },
    resolver: yupResolver(recurringTransactionSchema),
  });
  const type = form.watch("type");
  const currency = form.watch("currency");
  const interval = form.watch("interval");
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const { data: categories = [], isPending } =
    api.transactionCategory.getByType.useQuery({ type: [type] });

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
                  currency={currency}
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
          <FormLabel>Repeats every</FormLabel>
          <div className="mt-2 flex gap-2">
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
                          {interval === 1
                            ? frequencyUnits[frequency].singular
                            : frequencyUnits[frequency].plural}
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

        <Button
          type="button"
          variant="ghost"
          className="col-span-full justify-start px-0 text-muted-foreground"
          aria-expanded={showMoreOptions}
          aria-label={
            showMoreOptions
              ? "Hide additional options"
              : "Show additional options"
          }
          onClick={() => setShowMoreOptions((shown) => !shown)}
        >
          <ChevronDown
            className={cn(
              "transition-transform",
              showMoreOptions && "rotate-180",
            )}
          />
          <span className="font-normal capitalize">
            {type.toLowerCase()} · {currency.toUpperCase()}
          </span>
        </Button>

        {showMoreOptions && (
          <>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      form.setValue("categoryId", "");
                      field.onChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="capitalize">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TransactionType).map((transactionType) => (
                        <SelectItem
                          key={transactionType}
                          value={transactionType}
                          className="capitalize"
                        >
                          {transactionType.toLowerCase()}
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
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={3} className="uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </form>
    </Form>
  );
}
