"use client";

import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { api, type RouterOutputs } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import { TableSkeleton } from "~/components/table-skeleton";
import { toast } from "sonner";
import NewTransactionDialog from "./NewTransactionDialog";
import { TransactionTable } from "~/components/transaction-table";
import EditTransactionDialog from "./EditTransactionDialog";

export default function TransactionsPage() {
  const { data = [], refetch, isPending } = api.transaction.getAll.useQuery();
  const utils = api.useUtils();

  const { mutate: deleteTransaction } = api.transaction.delete.useMutation({
    onSuccess: () => {
      toast.success("Transaction deleted.");
      void refetch();
    },
  });

  const [isNewDialogOpen, setNewDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<RouterOutputs["transaction"]["getAll"][number]>();
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  function handleEditTransaction(id: string) {
    const transaction = data.find((t) => t.id === id);
    if (!transaction) {
      toast.error("Failed to find the transaction.");
      return;
    }
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  }

  function handleTransactionSuccess() {
    void refetch();
    void utils.cashFlow.getMonthlyCashFlow.invalidate();
    void utils.dashboard.getSummary.invalidate();
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/cash-flow">
                Cash flow
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Transactions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Button
          variant="outline"
          className="ml-auto"
          size="icon"
          onClick={() => setNewDialogOpen(true)}
        >
          <Plus />
        </Button>
      </header>

      <div className="mx-auto w-screen max-w-screen-md p-5">
        {isPending && <TableSkeleton />}
        {!isPending && (
          <TransactionTable
            showActions
            data={data}
            onDeleteTransaction={(id) => deleteTransaction({ id })}
            onEditTransaction={handleEditTransaction}
          />
        )}
      </div>

      <NewTransactionDialog
        key={`new-transaction-dialog-${isNewDialogOpen}`}
        isOpen={isNewDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={handleTransactionSuccess}
      />

      <EditTransactionDialog
        key={`edit-transaction-dialog-${isEditDialogOpen}`}
        isOpen={isEditDialogOpen}
        transaction={editingTransaction}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleTransactionSuccess}
      />
    </>
  );
}
