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
import { MonthPicker } from "~/components/ui/month-picker";
import {
  type CreateExchangeRate,
  createExchangeRateSchema,
} from "~/trpc/schemas/exchangeRate";
import { toMonthTimestamp } from "~/utils/date";

export type ExchangeRateDialogFormProps = {
  initialData?: CreateExchangeRate;
  formId?: string;
  onSubmit: (data: CreateExchangeRate) => void;
};

export function ExchangeRateDialogForm({
  initialData,
  formId,
  onSubmit,
}: ExchangeRateDialogFormProps) {
  const form = useForm({
    defaultValues: initialData ?? {
      baseCurrency: "",
      quoteCurrency: "",
      timestamp: toMonthTimestamp(new Date()),
    },
    resolver: yupResolver(createExchangeRateSchema),
  });

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
                <Input
                  placeholder="Rate"
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
