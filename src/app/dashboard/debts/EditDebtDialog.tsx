"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as yup from "yup";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
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
import { api } from "~/trpc/react";

const editDebtSchema = yup.object({
  id: yup.string().required(),
  name: yup.string().label("Name").required(),
  categoryId: yup.string().label("Category").required(),
  currency: yup.string().label("Currency").required(),
});

type EditDebtDialogProps = {
  debt?: {
    id: string;
    name: string;
    categoryId: string;
    currency: string;
  } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export default function EditDebtDialog({
  debt,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditDebtDialogProps) {
  const form = useForm({
    resolver: yupResolver(editDebtSchema),
    defaultValues: {
      id: debt?.id ?? "",
      name: debt?.name ?? "",
      categoryId: debt?.categoryId ?? "",
      currency: debt?.currency ?? "",
    },
  });
  const { mutate, isPending } = api.netWorthDebt.update.useMutation({
    onSuccess: () => {
      toast.success("Debt updated.");
      onOpenChange(false);
      onSuccess();
    },
  });
  const { data: categories = [], isPending: isFetchingCategories } =
    api.netWorthCategory.getByType.useQuery(
      { type: ["DEBT", "BOTH"] },
      { enabled: isOpen },
    );

  if (!debt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <Form {...form}>
          <form
            className="flex flex-col gap-5"
            onSubmit={form.handleSubmit((values) => mutate(values))}
          >
            <DialogHeader>
              <DialogTitle>Edit debt</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isFetchingCategories}
                    >
                      <FormControl>
                        <SelectTrigger isLoading={isFetchingCategories}>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input placeholder="EUR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
