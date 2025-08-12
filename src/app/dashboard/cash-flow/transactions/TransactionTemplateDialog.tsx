"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import TransactionForm, { type TransactionFormRef } from "./TransactionForm";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Currency } from "~/components/ui/number";
import { Skeleton } from "~/components/ui/skeleton";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { cn } from "~/lib/utils";

export type TransactionTemplateDialogProps = {
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function TransactionTemplateDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: TransactionTemplateDialogProps) {
  const { data = [], isPending } = api.transactionTemplate.getAll.useQuery(
    undefined,
    {
      enabled: isOpen,
    },
  );
  const formRef = useRef<TransactionFormRef>(null);
  const [template, setTemplate] = useState<(typeof data)[number]>();
  const initialData = template
    ? {
        ...template,
        amount: template.amount.toNumber(),
        timestamp: new Date(),
      }
    : undefined;

  const { mutate: create, isPending: isCreating } =
    api.transaction.create.useMutation({
      onSuccess: () => {
        toast.success("Transaction created.");
        onOpenChange(false);
        onSuccess();
      },
    });

  if (!initialData) {
    return (
      <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTitle className="sr-only">Transaction quick add</DialogTitle>
        <CommandInput placeholder="Quick add: type to search templates…" />
        <CommandList>
          <CommandEmpty>No templates found.</CommandEmpty>
          <CommandGroup heading="Templates">
            {data.map((template) => {
              const isExpense = template.type === "EXPENSE";
              const amount = template.amount.mul(isExpense ? -1 : 1);
              return (
                <CommandItem
                  key={template.id}
                  value={`${template.description} ${template.category.name}`}
                  onSelect={() => setTemplate(template)}
                >
                  <div className="flex w-full items-center justify-between">
                    <div>
                      <div className="font-medium">{template.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.category.name}
                      </div>
                    </div>

                    <Currency
                      value={amount}
                      options={{ currency: template.currency }}
                      className={cn(
                        "text-sm font-medium",
                        amount.isPos() && "text-financial-positive",
                        amount.isNeg() && "text-financial-negative",
                      )}
                    />
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "New transaction" : "Create from a template"}
          </DialogTitle>
        </DialogHeader>

        {!!data.length && (
          <TransactionForm
            ref={formRef}
            formId="transaction-template-dialog-form"
            initialData={initialData}
            onSubmit={create}
          />
        )}

        {isPending && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        )}

        {!data.length && !isPending && (
          <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don&apos;t have any templates yet
          </div>
        )}

        {initialData && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTemplate(undefined)}
            >
              Back
            </Button>

            <Button
              type="submit"
              disabled={isCreating}
              form="transaction-template-dialog-form"
            >
              {isCreating && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
