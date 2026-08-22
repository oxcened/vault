import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { TransactionType } from "@prisma/client";

type BulkChangeCategoryDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transactionIds: string[];
  transactionTypes: TransactionType[];
  onSuccess?: () => void;
};

export function BulkChangeCategoryDialog({
  isOpen,
  onOpenChange,
  transactionIds,
  transactionTypes,
  onSuccess,
}: BulkChangeCategoryDialogProps) {
  const [categoryId, setCategoryId] = useState<string>("");

  const { data: categories = [], isPending: isFetchingCategories } =
    api.transactionCategory.getByType.useQuery(
      { type: transactionTypes },
      {
        enabled: isOpen && transactionTypes.length > 0,
      },
    );

  const updateMany = api.transaction.updateManyCategory.useMutation({
    onSuccess: ({ count }) => {
      toast.success(
        `Category updated for ${count} transaction${count === 1 ? "" : "s"}.`,
      );
      onSuccess?.();
      onOpenChange(false);
    },
  });

  const handleSubmit = () => {
    if (!categoryId || transactionIds.length === 0) return;
    updateMany.mutate({ ids: transactionIds, categoryId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change category</DialogTitle>
          <DialogDescription>
            Move {transactionIds.length} transaction
            {transactionIds.length === 1 ? "" : "s"} to another category.
          </DialogDescription>
        </DialogHeader>

        <Select
          value={categoryId}
          disabled={isFetchingCategories}
          onValueChange={setCategoryId}
        >
          <SelectTrigger isLoading={isFetchingCategories}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!categoryId || updateMany.isPending}
            onClick={handleSubmit}
          >
            {updateMany.isPending ? <Loader2 className="animate-spin" /> : null}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}