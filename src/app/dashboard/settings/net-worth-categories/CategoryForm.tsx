import { NetWorthCategoryType, type NetWorthCategory } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Checkbox } from "~/components/ui/checkbox";
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
import { createNetWorthCategorySchema } from "~/trpc/schemas/netWorthCategory";
import type { z } from "zod";

type FormData = z.infer<typeof createNetWorthCategorySchema>;

export function CategoryForm({
  formId,
  initialData,
  defaultType = NetWorthCategoryType.ASSET,
  onSubmit,
}: {
  formId: string;
  initialData?: NetWorthCategory;
  defaultType?: NetWorthCategoryType;
  onSubmit: (data: FormData) => void;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(createNetWorthCategorySchema),
    defaultValues: initialData ?? {
      name: "",
      type: defaultType,
      isStock: false,
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
                  {Object.values(NetWorthCategoryType).map((type) => (
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
        <FormField
          control={form.control}
          name="isStock"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Stock category</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
