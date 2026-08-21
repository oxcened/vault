"use client";

import type { TransactionStatus, TransactionType } from "@prisma/client";
import { Check, Loader2, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { TransactionIcon } from "~/components/transactionTable/transaction-icon";
import { Button } from "~/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Currency } from "~/components/ui/number";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import TransactionForm, { type TransactionFormRef } from "./TransactionForm";

export type TransactionTemplateDialogProps = {
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

type QuickAddSelection = {
  amount: number;
  categoryId: string;
  categoryName: string;
  currency: string;
  description: string;
  key: string;
  type: TransactionType;
};

const getOptionSignature = (option: QuickAddSelection) =>
  [
    option.description.trim().toLocaleLowerCase(),
    option.amount,
    option.currency,
    option.type,
    option.categoryId,
  ].join("|");

export default function TransactionTemplateDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: TransactionTemplateDialogProps) {
  const { data: templates = [], isPending: templatesPending } =
    api.transactionTemplate.getAll.useQuery(undefined, { enabled: isOpen });
  const { data: frequent = [], isPending: frequentPending } =
    api.transactionTemplate.getFrequent.useQuery(undefined, {
      enabled: isOpen,
    });
  const formRef = useRef<TransactionFormRef>(null);
  const [selection, setSelection] = useState<QuickAddSelection>();
  const [isEditing, setEditing] = useState(false);

  const savedOptions = templates.map((template) => ({
    amount: template.amount.toNumber(),
    categoryId: template.categoryId,
    categoryName: template.category.name,
    currency: template.currency,
    description: template.description,
    key: `preset:${template.id}`,
    type: template.type,
  }));
  const savedSignatures = new Set(savedOptions.map(getOptionSignature));
  const frequentOptions = frequent
    .map((transaction) => {
      const option = {
        amount: transaction.amount.toNumber(),
        categoryId: transaction.categoryId,
        categoryName: transaction.category.name,
        currency: transaction.currency,
        description: transaction.description,
        key: `frequent:${transaction.id}`,
        type: transaction.type,
      };
      return option;
    })
    .filter((option) => !savedSignatures.has(getOptionSignature(option)));
  const isPending = templatesPending || frequentPending;

  const initialData = selection
    ? {
        amount: selection.amount,
        categoryId: selection.categoryId,
        currency: selection.currency,
        description: selection.description,
        status: "POSTED" as const satisfies TransactionStatus,
        timestamp: new Date(),
        type: selection.type,
      }
    : undefined;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelection(undefined);
      setEditing(false);
    }
    onOpenChange(open);
  };

  const { mutate: create, isPending: isCreating } =
    api.transaction.create.useMutation({
      onSuccess: () => {
        toast.success("Transaction recorded.");
        handleOpenChange(false);
        onSuccess();
      },
    });

  const renderOption = (option: QuickAddSelection) => {
    const displayAmount =
      option.type === "EXPENSE" ? -option.amount : option.amount;

    return (
      <CommandItem
        key={option.key}
        value={`${option.description} ${option.categoryName} ${option.amount} ${option.currency} ${option.key}`}
        onSelect={() => setSelection(option)}
      >
        <TransactionIcon category={option.categoryName} type={option.type} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{option.description}</div>
          <div className="truncate text-xs text-muted-foreground">
            {option.categoryName}
          </div>
        </div>
        <Currency
          value={displayAmount}
          options={{ currency: option.currency, signDisplay: "always" }}
          className={cn(
            "shrink-0 text-sm",
            displayAmount > 0 && "text-financial-positive",
            displayAmount < 0 && "text-financial-negative",
          )}
        />
      </CommandItem>
    );
  };

  if (!selection) {
    return (
      <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTitle className="sr-only">Quick add transaction</DialogTitle>
        <CommandInput placeholder="Search presets and frequent transactions…" />
        <CommandList>
          <CommandEmpty>
            {isPending ? "Loading…" : "No quick-add options found."}
          </CommandEmpty>
          {savedOptions.length > 0 && (
            <CommandGroup heading="Saved presets">
              {savedOptions.map(renderOption)}
            </CommandGroup>
          )}
          {frequentOptions.length > 0 && (
            <CommandGroup heading="Frequent">
              {frequentOptions.map(renderOption)}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    );
  }

  const displayAmount =
    selection.type === "EXPENSE" ? -selection.amount : selection.amount;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit details" : "Quick add"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Adjust this transaction before recording it."
              : "Confirm the transaction before recording it."}
          </DialogDescription>
        </DialogHeader>

        {isEditing && initialData ? (
          <TransactionForm
            ref={formRef}
            formId="transaction-template-dialog-form"
            initialData={initialData}
            onSubmit={create}
          />
        ) : (
          <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
            <TransactionIcon
              category={selection.categoryName}
              type={selection.type}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {selection.description}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {selection.categoryName} · Today
              </p>
            </div>
            <Currency
              value={displayAmount}
              options={{
                currency: selection.currency,
                signDisplay: "always",
              }}
              className={cn(
                "shrink-0 text-sm",
                displayAmount > 0 && "text-financial-positive",
                displayAmount < 0 && "text-financial-negative",
              )}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (isEditing) setEditing(false);
              else setSelection(undefined);
            }}
          >
            Back
          </Button>
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              <Pencil /> Edit details
            </Button>
          )}
          <Button
            type={isEditing ? "submit" : "button"}
            disabled={isCreating}
            form={isEditing ? "transaction-template-dialog-form" : undefined}
            onClick={
              isEditing || !initialData ? undefined : () => create(initialData)
            }
          >
            {isCreating ? <Loader2 className="animate-spin" /> : <Check />}
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
