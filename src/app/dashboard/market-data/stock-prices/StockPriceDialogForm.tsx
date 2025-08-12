import { yupResolver } from "@hookform/resolvers/yup";
import { CalendarIcon } from "lucide-react";
import { DateTime } from "luxon";
import { useForm } from "react-hook-form";
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
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import {
  type CreateStockPrice,
  createStockPriceSchema,
} from "~/trpc/schemas/stockPrice";

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
      timestamp: DateTime.now().toUTC().startOf("day").toJSDate(),
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
            <FormItem>
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl className="w-full">
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
                    timeZone="UTC"
                    selected={field.value}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    defaultMonth={field.value}
                    onSelect={field.onChange}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
