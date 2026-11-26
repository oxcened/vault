"use client";

import { CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AmountInput } from "~/components/ui/amount-input";
import { DescriptionAutocomplete } from "~/components/ui/description-autocomplete";
import { TransactionIcon } from "~/components/transactionTable/transaction-icon";
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
  FormDescription,
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
import { type TransactionStatus, TransactionType } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { cn } from "~/lib/utils";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { TimePicker } from "~/components/ui/time-picker";
import { mergeDateAndTime } from "~/utils/date";
import { useDebounce } from "use-debounce";
import { getCurrencyFractionDigits } from "~/utils/currency";

export type TransactionFormRef = { reset: () => void };

export type TransactionFormProps = {
  initialData?: CreateTransaction;
  isEditing?: boolean;
  formId?: string;
  hideTimestamp?: boolean;
  fixedType?: TransactionType;
  onSubmit: (data: CreateTransaction) => void;
};

type TimestampSuggestion = { label: string; date: Date };

function setTime(date: Date, hours: number, minutes = 0) {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function getTimestampSuggestions(now: Date): TimestampSuggestion[] {
  const suggestions: TimestampSuggestion[] = [{ label: "Now", date: now }];
  const hour = now.getHours();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (hour >= 12) {
    suggestions.push({ label: "This morning", date: setTime(now, 9) });
  }

  suggestions.push(
    { label: "Yesterday", date: setTime(yesterday, hour, now.getMinutes()) },
  );

  return suggestions;
}

const TransactionForm = forwardRef<TransactionFormRef, TransactionFormProps>(
  function (
    {
      initialData,
      isEditing = false,
      formId,
      hideTimestamp = false,
      fixedType,
      onSubmit,
    },
    ref,
  ) {
    const [showMoreOptions, setShowMoreOptions] = useState(
      isEditing && !fixedType,
    );
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [isCustomDateSelected, setCustomDateSelected] = useState(
      isEditing || !!initialData,
    );
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [categorySuggestionSource, setCategorySuggestionSource] = useState<
      string | null
    >(null);
    const categoryWasManuallySelected = useRef(false);
    const automaticallySelectedCategory = useRef<string | undefined>(undefined);
    const form = useForm({
      defaultValues: initialData ?? {
        currency: APP_CURRENCY,
        categoryId: "",
        description: "",
        timestamp: new Date(),
        type: (fixedType ?? "EXPENSE") satisfies TransactionType,
        status: "POSTED" satisfies TransactionStatus,
      },
      resolver: yupResolver(createTransactionSchema),
    });

    const watchType = form.watch("type");
    const watchCurrency = form.watch("currency");
    const watchTimestamp = form.watch("timestamp");
    const watchDescription = form.watch("description");
    const watchAmount = form.watch("amount");
    const watchCategoryId = form.watch("categoryId");
    const [debouncedDescription] = useDebounce(watchDescription.trim(), 300);

    useEffect(() => {
      const timer = window.setInterval(
        () => setCurrentTime(new Date()),
        60_000,
      );
      return () => window.clearInterval(timer);
    }, []);

    const { data: categorySuggestion } =
      api.transaction.suggestCategory.useQuery(
        {
          description: debouncedDescription,
          type: watchType,
        },
        {
          enabled: !isEditing && debouncedDescription.length > 0,
        },
      );

    const { data: descriptionSuggestions = [] } =
      api.transaction.descriptionSuggestions.useQuery(
        { query: debouncedDescription, type: watchType },
        {
          enabled: !isEditing && debouncedDescription.length > 0,
        },
      );

    useEffect(() => {
      if (
        isEditing ||
        categoryWasManuallySelected.current ||
        categorySuggestion === undefined
      ) {
        return;
      }

      if (categorySuggestion) {
        automaticallySelectedCategory.current = categorySuggestion.categoryId;
        setCategorySuggestionSource(debouncedDescription);
        form.setValue("categoryId", categorySuggestion.categoryId, {
          shouldDirty: false,
          shouldValidate: false,
        });
      } else if (automaticallySelectedCategory.current) {
        automaticallySelectedCategory.current = undefined;
        setCategorySuggestionSource(null);
        form.setValue("categoryId", "", {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
    }, [categorySuggestion, debouncedDescription, form, isEditing]);

    const { data: categories = [], isPending: isFetchingCategories } =
      api.transactionCategory.getByType.useQuery(
        {
          type: [watchType],
        },
        {
          enabled: !!watchType,
        },
      );

    const selectedCategory = categories.find(
      (category) => category.id === watchCategoryId,
    );
    const isRefund = watchType === "EXPENSE" && Number(watchAmount) < 0;

    useImperativeHandle(ref, () => ({
      reset: () => {
        categoryWasManuallySelected.current = false;
        automaticallySelectedCategory.current = undefined;
        setCategorySuggestionSource(null);
        setCustomDateSelected(false);
        form.reset();
        form.setFocus("amount");
      },
    }));

    return (
      <Form {...form}>
        <form
          id={formId}
          className="grid grid-cols-1 gap-2 md:grid-cols-2"
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
                    onBlur={field.onBlur}
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    currencyAction={
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-7 items-center gap-1 rounded px-1.5 text-xs font-medium uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Change currency, currently ${watchCurrency}`}
                          >
                            {watchCurrency}
                            <ChevronDown className="size-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3" align="end">
                          <div className="space-y-2">
                            <label
                              htmlFor={
                                formId
                                  ? `${formId}-currency`
                                  : "transaction-currency"
                              }
                              className="text-sm font-medium"
                            >
                              Currency
                            </label>
                            <Input
                              id={
                                formId
                                  ? `${formId}-currency`
                                  : "transaction-currency"
                              }
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
                    maxFractionDigits={getCurrencyFractionDigits(watchCurrency)}
                    placeholder="0.00"
                    autoFocus={!isEditing}
                    aria-invalid={!!form.formState.errors.amount}
                  />
                </FormControl>
                {isRefund && (
                  <FormDescription>
                    Refund — this will reduce spending
                    {selectedCategory ? ` in ${selectedCategory.name}` : ""}.
                  </FormDescription>
                )}
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
                  <DescriptionAutocomplete
                    {...field}
                    placeholder="Description"
                    suggestions={descriptionSuggestions}
                    onValueChange={field.onChange}
                    onSuggestionSelect={(suggestion) => {
                      if (categoryWasManuallySelected.current) return;

                      automaticallySelectedCategory.current =
                        suggestion.categoryId;
                      setCategorySuggestionSource(suggestion.description);
                      form.setValue("categoryId", suggestion.categoryId, {
                        shouldDirty: false,
                        shouldValidate: false,
                      });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Category</FormLabel>

                <Select
                  value={field.value}
                  disabled={isFetchingCategories}
                  onValueChange={(value) => {
                    categoryWasManuallySelected.current = true;
                    automaticallySelectedCategory.current = undefined;
                    setCategorySuggestionSource(null);
                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger isLoading={isFetchingCategories}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <TransactionIcon
                            category={category.name}
                            type={watchType}
                            size="sm"
                          />
                          {category.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {categorySuggestionSource && (
                  <FormDescription>
                    Suggested from “{categorySuggestionSource}” history
                  </FormDescription>
                )}

                <FormMessage />
              </FormItem>
            )}
          />

          {!hideTimestamp && (
            <FormItem className="col-span-full">
              <FormLabel>Date and time</FormLabel>
              <div className="flex flex-wrap gap-2">
                {!isEditing &&
                  getTimestampSuggestions(currentTime).map((suggestion) => (
                    <Button
                      key={suggestion.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        watchTimestamp?.getTime() === suggestion.date.getTime() &&
                          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                      )}
                      onClick={() => {
                        setCustomDateSelected(false);
                        form.setValue("timestamp", suggestion.date);
                      }}
                    >
                      {suggestion.label}
                    </Button>
                  ))}
                <Popover
                  open={isDatePickerOpen}
                  onOpenChange={setDatePickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "px-2 font-normal",
                        isCustomDateSelected &&
                          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                      )}
                      aria-label={
                        isCustomDateSelected && watchTimestamp
                          ? `Change date and time, selected ${watchTimestamp.toLocaleString()}`
                          : "Pick date and time"
                      }
                      title={
                        isCustomDateSelected
                          ? "Change date and time"
                          : "Pick date and time"
                      }
                    >
                      {isCustomDateSelected && watchTimestamp && (
                        <span>
                          {watchTimestamp.toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      <CalendarIcon
                        className={cn(
                          "size-4 opacity-60",
                          isCustomDateSelected && "ml-1",
                        )}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="single"
                      selected={watchTimestamp}
                      disabled={(date) => date > new Date()}
                      defaultMonth={watchTimestamp}
                      onSelect={(date) => {
                        if (!date) return;
                        setCustomDateSelected(true);
                        form.setValue(
                          "timestamp",
                          mergeDateAndTime(date, watchTimestamp),
                          { shouldDirty: true },
                        );
                      }}
                    />
                    <div className="border-t border-border p-3">
                      <TimePicker
                        date={watchTimestamp}
                        setDate={(date) =>
                          form.setValue("timestamp", date, {
                            shouldDirty: true,
                          })
                        }
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </FormItem>
          )}

          {!isEditing && !fixedType && (
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
              <span className="font-normal">More options</span>
            </Button>
          )}

          {showMoreOptions && !fixedType && (
            <>
              {!fixedType && (
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          categoryWasManuallySelected.current = false;
                          automaticallySelectedCategory.current = undefined;
                          setCategorySuggestionSource(null);
                          form.setValue("categoryId", "", {
                            shouldDirty: true,
                            shouldValidate: false,
                          });
                          field.onChange(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="capitalize">
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(TransactionType).map((type) => (
                            <SelectItem
                              key={type}
                              value={type}
                              className="capitalize"
                            >
                              {type.toLocaleLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

            </>
          )}
        </form>
      </Form>
    );
  },
);

TransactionForm.displayName = "TransactionForm";
export default TransactionForm;
