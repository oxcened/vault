"use client";

import type { NetWorthCategory, NetWorthCategoryType } from "@prisma/client";
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
  category?: NetWorthCategory;
  defaultType?: NetWorthCategoryType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = api.useUtils();
  const finish = (action: string) => {
    toast.success(`Net worth category ${action}.`);
    void utils.netWorthCategory.getAll.invalidate();
    void utils.netWorthCategory.getByType.invalidate();
    onOpenChange(false);
  };
  const create = api.netWorthCategory.create.useMutation({
    onSuccess: () => finish("created"),
  });
  const update = api.netWorthCategory.update.useMutation({
    onSuccess: () => finish("updated"),
  });
  const formId = category
    ? "edit-net-worth-category-form"
    : "new-net-worth-category-form";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit" : "Add"} net worth category
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
