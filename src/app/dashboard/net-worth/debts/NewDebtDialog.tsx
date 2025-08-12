"use client";

import { Calculator, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { APP_CURRENCY } from "~/constants";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { yupResolver } from "@hookform/resolvers/yup";
import { createNetWorthDebtSchema } from "~/trpc/schemas/netWorthDebt";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { toast } from "sonner";
import { safeEvaluate } from "~/utils/number";

export type NewDebtDialogProps = {
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function NewDebtDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: NewDebtDialogProps) {
  const [createMore, setCreateMore] = useState(false);
  const { mutate, isPending } = api.netWorthDebt.create.useMutation({
    onSuccess: () => {
      toast.success("Debt created.");
      if (createMore) {
        form.reset();
      } else {
        onOpenChange(false);
      }
      onSuccess();
    },
  });
  const form = useForm({
    defaultValues: {
      categoryId: "",
      currency: APP_CURRENCY,
      name: "",
      initialQuantity: "",
    },
    resolver: yupResolver(createNetWorthDebtSchema),
  });

  const { data: categories = [], isPending: isFetchingCategories } =
    api.netWorthCategory.getByType.useQuery(
      {
        type: ["DEBT", "BOTH"],
      },
      {
        enabled: isOpen,
      },
    );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="flex flex-col gap-5"
          >
            <DialogHeader>
              <DialogTitle>New debt</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
                name="initialQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial quantity/value</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Initial quantity/value"
                          {...field}
                        />
                        <Calculator className="absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {safeEvaluate(field.value)
                        ? "Result: " + safeEvaluate(field.value)
                        : "You can enter values as a formula, e.g. 1000 + 500."}
                    </FormDescription>
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
                      <Input
                        placeholder="Currency (e.g., USD, EUR, BTC)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <div className="flex items-center space-x-2">
                <Switch
                  id="airplane-mode"
                  onCheckedChange={(checked) => setCreateMore(checked)}
                />
                <Label htmlFor="airplane-mode">Create more</Label>
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
