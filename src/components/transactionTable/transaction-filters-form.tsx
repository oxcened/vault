import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "../ui/form";
import {
  MultiSelect,
  MultiSelectGroup,
  MultiSelectOption,
} from "../ui/multi-select";
import { useForm } from "react-hook-form";
import { TransactionCategory, TransactionType } from "@prisma/client";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

export type TransactionFilters = {
  types: TransactionType[];
  categories: string[];
};

export const formValidationSchema = yup.object({
  types: yup
    .array()
    .label("Types")
    .of(yup.mixed<TransactionType>().required())
    .required()
    .min(1, "At least one type must be selected"),
  categories: yup
    .array()
    .label("Categories")
    .of(yup.string().required())
    .required(),
});

export const TransactionFiltersForm = ({
  defaultValues,
  transactionCategories,
  isLoadingCategories,
  onSubmit,
}: {
  defaultValues: TransactionFilters;
  transactionCategories: TransactionCategory[];
  isLoadingCategories: boolean;
  onSubmit: (data: TransactionFilters) => void;
}) => {
  const form = useForm<TransactionFilters>({
    defaultValues,
    resolver: yupResolver(formValidationSchema),
  });

  const watchTypes = form.watch("types");

  const categoriesByTypeMap = transactionCategories
    .filter((category) => watchTypes.includes(category.type))
    .reduce((acc, category) => {
      const type =
        category.type.charAt(0).toUpperCase() +
        category.type.slice(1).toLowerCase();

      if (!acc.has(type)) {
        acc.set(type, []);
      }

      acc.get(type)!.push({
        value: category.id,
        label: category.name,
      });

      return acc;
    }, new Map<string, MultiSelectOption[]>());

  const categoriesByType: MultiSelectGroup[] = Array.from(
    categoriesByTypeMap.entries(),
  ).map(([type, categories]) => ({
    heading: type,
    options: categories,
  }));

  return (
    <Form {...form}>
      <form
        id="transaction-filters-dialog-form"
        className="space-y-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="types"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction types</FormLabel>

              {Object.values(TransactionType).map((type) => (
                <FormItem
                  key={type}
                  className="flex flex-row items-start space-x-3 space-y-0"
                >
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(type)}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...field.value, type])
                          : field.onChange(
                              field.value?.filter(
                                (value: any) => value !== type,
                              ),
                            );
                      }}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal capitalize">
                    {type.toLocaleLowerCase()}
                  </FormLabel>
                </FormItem>
              ))}

              <FormMessage />
            </FormItem>
          )}
        ></FormField>

        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select categories</FormLabel>
              <FormDescription>
                Leave empty to select all categories
              </FormDescription>
              <FormControl>
                <MultiSelect
                  options={categoriesByType}
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                  placeholder={
                    isLoadingCategories
                      ? "Loading, please wait..."
                      : "Choose categories..."
                  }
                  modalPopover
                  disabled={isLoadingCategories}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
