import {
  TransactionCategoryType,
  type TransactionCategory,
} from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { createTransactionCategorySchema } from "~/trpc/schemas/transactionCategory";
import type { z } from "zod";

type FormData = z.infer<typeof createTransactionCategorySchema>;

export function CategoryForm({
  formId,
  initialData,
  defaultType = TransactionCategoryType.INCOME,
  onSubmit,
}: {
  formId: string;
  initialData?: TransactionCategory;
  defaultType?: TransactionCategoryType;
  onSubmit: (data: FormData) => void;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(createTransactionCategorySchema),
    defaultValues: initialData ?? {
      name: "",
      type: defaultType,
    },
  });

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="capitalize">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TransactionCategoryType).map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
