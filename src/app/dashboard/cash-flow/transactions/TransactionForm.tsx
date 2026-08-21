"use client";

import { CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AmountInput } from "~/components/ui/amount-input";
import { DescriptionAutocomplete } from "~/components/ui/description-autocomplete";
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
import { TransactionStatus, TransactionType } from "@prisma/client";
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
  formId?: string;
  onSubmit: (data: CreateTransaction) => void;
};

const TransactionForm = forwardRef<TransactionFormRef, TransactionFormProps>(
  function ({ initialData, formId, onSubmit }, ref) {
    const [showMoreOptions, setShowMoreOptions] = useState(!!initialData);
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
        type: "EXPENSE" satisfies TransactionType,
        status: "POSTED" satisfies TransactionStatus,
      },
      resolver: yupResolver(createTransactionSchema),
    });

    const watchType = form.watch("type");
    const watchStatus = form.watch("status");
    const watchCurrency = form.watch("currency");
    const watchTimestamp = form.watch("timestamp");
    const watchDescription = form.watch("description");
    const watchAmount = form.watch("amount");
    const watchCategoryId = form.watch("categoryId");
    const [debouncedDescription] = useDebounce(watchDescription.trim(), 300);

    const { data: categorySuggestion } =
      api.transaction.suggestCategory.useQuery(
        {
          description: debouncedDescription,
          type: watchType,
        },
        {
          enabled: !initialData && debouncedDescription.length > 0,
        },
      );

    const { data: descriptionSuggestions = [] } =
      api.transaction.descriptionSuggestions.useQuery(
        { query: debouncedDescription, type: watchType },
        {
          enabled: !initialData && debouncedDescription.length > 0,
        },
      );

    useEffect(() => {
      if (
        initialData ||
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
    }, [categorySuggestion, debouncedDescription, form, initialData]);

    const isToday =
      watchTimestamp?.toDateString() === new Date().toDateString();
    const optionSummary = [
      watchType.toLocaleLowerCase(),
      watchStatus.toLocaleLowerCase(),
      watchCurrency.toUpperCase(),
      isToday ? "today" : watchTimestamp?.toLocaleDateString(),
    ]
      .filter(Boolean)
      .join(" · ");

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
                    currency={watchCurrency}
                    maxFractionDigits={getCurrencyFractionDigits(watchCurrency)}
                    placeholder="0.00"
                    autoFocus={!initialData}
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
                        {category.name}
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

          <Button
            type="button"
            variant="ghost"
            className="col-span-full justify-start px-0 text-muted-foreground"
            aria-expanded={showMoreOptions}
            onClick={() => setShowMoreOptions((shown) => !shown)}
          >
            <ChevronDown
              className={cn(
                "transition-transform",
                showMoreOptions && "rotate-180",
              )}
            />
            {showMoreOptions ? "Fewer options" : "More options"}
            {!showMoreOptions && (
              <span className="font-normal capitalize">· {optionSummary}</span>
            )}
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

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="capitalize">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TransactionStatus).map((status) => (
                          <SelectItem
                            key={status}
                            value={status}
                            className="capitalize"
                          >
                            {status.toLocaleLowerCase()}
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
                          initialFocus
                          mode="single"
                          selected={field.value}
                          disabled={(date) =>
                            watchStatus === "POSTED"
                              ? date > new Date()
                              : date < new Date()
                          }
                          defaultMonth={field.value}
                          onSelect={(date) =>
                            date &&
                            field.onChange(mergeDateAndTime(date, field.value))
                          }
                        />
                        <div className="border-t border-border p-3">
                          <TimePicker
                            date={field.value}
                            setDate={field.onChange}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </form>
      </Form>
    );
  },
);

TransactionForm.displayName = "TransactionForm";
export default TransactionForm;
