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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "New transaction" : "Create from a template"}
          </DialogTitle>
        </DialogHeader>

        {!!data.length &&
          (!initialData ? (
            <ScrollArea defaultValue="comfortable" className="h-[300px]">
              <ul className="flex flex-col gap-2">
                {data.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="flex-1"
                    onClick={() => setTemplate(template)}
                  >
                    <span>{template.description}</span>

                    <Currency
                      value={template.amount}
                      options={{ currency: template.currency }}
                      className="ml-auto text-muted-foreground"
                    />
                  </Button>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <TransactionForm
              ref={formRef}
              formId="transaction-template-dialog-form"
              initialData={initialData}
              onSubmit={create}
            />
          ))}

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
