import { yupResolver } from "@hookform/resolvers/yup";
import { CalendarIcon } from "lucide-react";
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
import { cn } from "~/lib/utils";
import {
  type CreateExchangeRate,
  createExchangeRateSchema,
} from "~/trpc/schemas/exchangeRate";

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
      timestamp: new Date(
        Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          new Date().getUTCDate(),
          0,
          0,
          0,
          0,
        ),
      ),
    },
    resolver: yupResolver(createExchangeRateSchema),
  });

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
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
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
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
