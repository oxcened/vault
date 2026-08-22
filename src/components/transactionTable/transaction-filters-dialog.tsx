import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import {
  TransactionFilters,
  TransactionFiltersForm,
} from "./transaction-filters-form";
import { api } from "~/trpc/react";
import { useState } from "react";
import { TransactionType } from "@prisma/client";
import { cn } from "~/lib/utils";

export const TransactionFiltersDialog = ({
  defaultValues,
  showDateRangeFilter = true,
  onSubmit,
}: {
  defaultValues: TransactionFilters;
  showDateRangeFilter?: boolean;
  onSubmit: (data: TransactionFilters) => void;
}) => {
  const { data: transactionCategories = [], isPending: isLoadingCategories } =
    api.transactionCategory.getAll.useQuery();
  const [open, setOpen] = useState(false);
  const activeFilterCount =
    (defaultValues.types.length !== Object.values(TransactionType).length
      ? 1
      : 0) +
    (defaultValues.categories.length > 0 ? 1 : 0) +
    (defaultValues.dateRange?.from || defaultValues.dateRange?.to ? 1 : 0);

  const handleSubmit = (data: TransactionFilters) => {
    onSubmit(data);
    setOpen(false);
  };

  const handleReset = () => {
    onSubmit({
      types: Object.values(TransactionType),
      categories: [],
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-2",
            activeFilterCount > 0 &&
              "border-blue-500/30 bg-blue-500/[0.07] text-blue-500 hover:bg-blue-500/10 hover:text-blue-500",
          )}
        >
          <SlidersHorizontal />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-semibold leading-none text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transaction filters</DialogTitle>
        </DialogHeader>

        <TransactionFiltersForm
          defaultValues={defaultValues}
          transactionCategories={transactionCategories}
          isLoadingCategories={isLoadingCategories}
          showDateRangeFilter={showDateRangeFilter}
          onSubmit={handleSubmit}
        />

        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            className="mr-auto"
            onClick={handleReset}
          >
            Reset
          </Button>

          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>

          <Button type="submit" form="transaction-filters-dialog-form">
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
