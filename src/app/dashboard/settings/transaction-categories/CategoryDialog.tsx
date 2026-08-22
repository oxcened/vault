"use client";

import type {
  TransactionCategory,
  TransactionCategoryType,
} from "@prisma/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { CategoryForm } from "./CategoryForm";

export function CategoryDialog({
  category,
  defaultType,
  isOpen,
  onOpenChange,
}: {
  category?: TransactionCategory;
  defaultType?: TransactionCategoryType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = api.useUtils();
  const finish = (action: string) => {
    toast.success(`Transaction category ${action}.`);
    void utils.transactionCategory.getAll.invalidate();
    void utils.transactionCategory.getByType.invalidate();
    onOpenChange(false);
  };
  const create = api.transactionCategory.create.useMutation({
    onSuccess: () => finish("created"),
  });
  const update = api.transactionCategory.update.useMutation({
    onSuccess: () => finish("updated"),
  });
  const formId = category
    ? "edit-transaction-category-form"
    : "new-transaction-category-form";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit" : "Add"} transaction category
          </DialogTitle>
        </DialogHeader>
        <CategoryForm
          formId={formId}
          initialData={category}
          defaultType={defaultType}
          onSubmit={(data) =>
            category
              ? update.mutate({ id: category.id, ...data })
              : create.mutate(data)
          }
        />
        <DialogFooter>
          <Button
            type="submit"
            form={formId}
            disabled={create.isPending || update.isPending}
          >
            {(create.isPending || update.isPending) && (
              <Loader2 className="animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
