import { yupResolver } from "@hookform/resolvers/yup";
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
import { Input } from "~/components/ui/input";
import { AmountInput } from "~/components/ui/amount-input";
import { MonthPicker } from "~/components/ui/month-picker";
import {
  type CreateExchangeRate,
  createExchangeRateSchema,
} from "~/trpc/schemas/exchangeRate";
import { toMonthTimestamp } from "~/utils/date";

export type ExchangeRateDialogFormProps = {
  initialData?: CreateExchangeRate;
  defaultBaseCurrency?: string;
  defaultQuoteCurrency?: string;
  formId?: string;
  onSubmit: (data: CreateExchangeRate) => void;
};

export function ExchangeRateDialogForm({
  initialData,
  defaultBaseCurrency,
  defaultQuoteCurrency,
  formId,
  onSubmit,
}: ExchangeRateDialogFormProps) {
  const form = useForm({
    defaultValues: initialData ?? {
      baseCurrency: defaultBaseCurrency ?? "",
      quoteCurrency: defaultQuoteCurrency ?? "",
      timestamp: toMonthTimestamp(new Date()),
    },
    resolver: yupResolver(createExchangeRateSchema),
  });
  const quoteCurrency = form.watch("quoteCurrency");

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-2 md:grid-cols-2"
      >
        <FormField
          control={form.control}
          name="baseCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base currency</FormLabel>
              <FormControl>
                <Input placeholder="Base currency" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quoteCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quote currency</FormLabel>
              <FormControl>
                <Input placeholder="Quote currency" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate</FormLabel>
              <FormControl>
                <AmountInput
                  ref={field.ref}
                  name={field.name}
                  onBlur={field.onBlur}
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                  currency={quoteCurrency?.toUpperCase()}
                  maxFractionDigits={8}
                  placeholder="0.00"
                  autoFocus={!initialData}
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
              <FormLabel>Month</FormLabel>
              <FormControl>
                <MonthPicker
                  value={field.value}
                  maxMonth={toMonthTimestamp(new Date())}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                One rate per currency pair and month.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
