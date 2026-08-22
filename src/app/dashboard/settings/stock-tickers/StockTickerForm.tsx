import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
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
  CreateStockTicker,
  createStockTickerSchema,
} from "~/trpc/schemas/stockTicker";

export type StockTickerFormProps = {
  initialData?: CreateStockTicker;
  formId?: string;
  onSubmit: (data: CreateStockTicker) => void;
};

export function StockTickerForm({
  initialData,
  formId,
  onSubmit,
}: StockTickerFormProps) {
  const form = useForm({
    defaultValues: initialData ?? {
      name: "",
      ticker: "",
      exchange: "",
    },
    resolver: yupResolver(createStockTickerSchema),
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ticker"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ticker</FormLabel>
              <FormControl>
                <Input placeholder="Ticker" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="exchange"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exchange</FormLabel>
              <FormControl>
                <Input placeholder="Exchange" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
