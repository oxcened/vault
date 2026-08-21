"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type Holding } from "~/components/holdings/net-worth-holdings";
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
  FormDescription,
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
import { Switch } from "~/components/ui/switch";
import { api } from "~/trpc/react";
import { updateNetWorthAssetSchema } from "~/trpc/schemas/netWorthAsset";

type EditAssetDialogProps = {
  asset?: Holding;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export default function EditAssetDialog({
  asset,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditAssetDialogProps) {
  const form = useForm({
    resolver: yupResolver(updateNetWorthAssetSchema),
    defaultValues: {
      id: asset?.id ?? "",
      name: asset?.name ?? "",
      categoryId: asset?.categoryId ?? "",
      currency: asset?.currency ?? "",
      tickerId: asset?.tickerId ?? "",
      isLiquid: asset?.isLiquid ?? false,
    },
  });

  const { mutate, isPending } = api.netWorthAsset.update.useMutation({
    onSuccess: () => {
      toast.success("Asset updated.");
      onOpenChange(false);
      onSuccess();
    },
  });

  const { data: categories = [], isPending: isFetchingCategories } =
    api.netWorthCategory.getByType.useQuery(
      { type: ["ASSET", "BOTH"] },
      { enabled: isOpen },
    );

  const categoryId = form.watch("categoryId");
  const isStock =
    categories.find((category) => category.id === categoryId)?.isStock ?? false;

  const { data: stockTickers = [], isPending: isFetchingStockTickers } =
    api.stockTicker.getAll.useQuery(undefined, {
      enabled: isOpen && isStock,
    });

  useEffect(() => {
    if (categories.length > 0 && !isStock) {
      form.setValue("tickerId", "");
    }
  }, [categories.length, form, isStock]);

  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <Form {...form}>
          <form
            className="flex flex-col gap-5"
            onSubmit={form.handleSubmit((values) => mutate(values))}
          >
            <DialogHeader>
              <DialogTitle>Edit asset</DialogTitle>
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

              {isStock && (
                <FormField
                  control={form.control}
                  name="tickerId"
                  render={({ field }) => (
                    <FormItem>
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
                              {ticker.ticker} – {ticker.name} ({ticker.exchange}
                              )
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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

              <FormField
                control={form.control}
                name="isLiquid"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-3 md:col-span-2">
                    <div>
                      <FormLabel>Liquid holding</FormLabel>
                      <FormDescription>
                        Can be readily used to cover your expenses.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
