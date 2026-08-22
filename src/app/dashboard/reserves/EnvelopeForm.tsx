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
import {
  normalizeReserveIcon,
  reserveIconOptions,
} from "~/components/reserves/reserve-icon";
import { DEFAULT_RESERVE_ICON } from "~/constants/reserve-icons";
import { cn } from "~/lib/utils";
import { CreateEnvelope, createEnvelopeSchema } from "~/trpc/schemas/envelope";

export type EnvelopeFormProps = {
  initialData?: CreateEnvelope;
  formId?: string;
  onSubmit: (data: CreateEnvelope) => void;
};

export function EnvelopeForm({
  initialData,
  formId,
  onSubmit,
}: EnvelopeFormProps) {
  const form = useForm({
    defaultValues: initialData ?? {
      name: "",
      icon: DEFAULT_RESERVE_ICON,
      priority: 0,
    },
    resolver: yupResolver(createEnvelopeSchema),
  });

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Taxes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {reserveIconOptions.map(({ name, label, icon: Icon }) => {
                    const selected = normalizeReserveIcon(field.value) === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        aria-label={label}
                        aria-pressed={selected}
                        title={label}
                        onClick={() => field.onChange(name)}
                        className={cn(
                          "flex size-10 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
                          selected &&
                            "border-primary/50 bg-primary/10 text-primary ring-1 ring-primary/20",
                        )}
                      >
                        <Icon className="size-4" />
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target amount</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional"
                  type="number"
                  step="any"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Optional. Leave empty for a flexible reserve.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reserved amount</FormLabel>
              <FormControl>
                <Input
                  placeholder="0.00"
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
      </form>
    </Form>
  );
}
