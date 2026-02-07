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
import { FilterIcon } from "lucide-react";
import {
  TransactionFilters,
  TransactionFiltersForm,
} from "./transaction-filters-form";
import { api } from "~/trpc/react";
import { useState } from "react";

export const TransactionFiltersDialog = ({
  defaultValues,
  onSubmit,
}: {
  defaultValues: TransactionFilters;
  onSubmit: (data: TransactionFilters) => void;
}) => {
  const { data: transactionCategories = [], isPending: isLoadingCategories } =
    api.transactionCategory.getAll.useQuery();
  const [open, setOpen] = useState(false);

  const handleSubmit = (data: TransactionFilters) => {
    onSubmit(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FilterIcon />
          Filters
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
          onSubmit={handleSubmit}
        />

        <DialogFooter>
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
