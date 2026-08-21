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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import {
  type CreateStockPrice,
  createStockPriceSchema,
} from "~/trpc/schemas/stockPrice";
import { toMonthTimestamp } from "~/utils/date";

export type StockPriceDialogFormProps = {
  initialData?: CreateStockPrice;
  formId?: string;
  onSubmit: (data: CreateStockPrice) => void;
};

export function StockPriceDialogForm({
  initialData,
  formId,
  onSubmit,
}: StockPriceDialogFormProps) {
  const form = useForm({
    defaultValues: initialData ?? {
      tickerId: "",
      timestamp: toMonthTimestamp(new Date()),
    },
    resolver: yupResolver(createStockPriceSchema),
  });

  const { data: stockTickers = [], isPending: isFetchingStockTickers } =
    api.stockTicker.getAll.useQuery();

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-2 md:grid-cols-2"
      >
        <FormField
          control={form.control}
          name="tickerId"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Stock ticker</FormLabel>

              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isFetchingStockTickers}
              >
                <FormControl>
                  <SelectTrigger isLoading={isFetchingStockTickers}>
                    <SelectValue placeholder="Select a stock ticker" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stockTickers.map((ticker) => (
                    <SelectItem key={ticker.id} value={ticker.id}>
                      {ticker.ticker} – {ticker.name} ({ticker.exchange})
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
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  placeholder="Price"
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
              <FormDescription>One price per ticker and month.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
