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
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { ChevronDown, Loader2, PlusIcon, ZapIcon } from "lucide-react";
import { TableSkeleton } from "~/components/table-skeleton";
import { toast } from "sonner";
import NewTransactionDialog from "./NewTransactionDialog";
import { TransactionTable } from "~/components/transaction-table";
import EditTransactionDialog from "./EditTransactionDialog";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import Decimal from "decimal.js";
import { TransactionType } from "@prisma/client";
import TransactionTemplateDialog from "./TransactionTemplateDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

type Transaction = {
  id: string;
  amount: Decimal;
  currency: string;
  timestamp: Date;
  description: string;
  type: TransactionType;
  categoryId: string;
  category: {
    name: string;
  };
};

export default function TransactionsPage() {
  const {
    data,
    refetch,
    isPending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = api.transaction.getAll.useInfiniteQuery(
    {
      limit: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const utils = api.useUtils();

  const { mutate: deleteTransaction } = api.transaction.delete.useMutation({
    onSuccess: () => {
      toast.success("Transaction deleted.");
      void refetch();
    },
  });

  const [isNewDialogOpen, setNewDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction>();
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false);

  const transactions = data?.pages.flatMap((page) => page.items) ?? [];

  function handleEditTransaction(id: string) {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) {
      toast.error("Failed to find the transaction.");
      return;
    }
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  }

  const { mutate: saveTemplate } = api.transactionTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("Transaction template created.");
      void utils.transactionTemplate.getAll.invalidate();
    },
  });

  function handleTransactionSuccess() {
    void refetch();
    void utils.cashFlow.getMonthlyCashFlow.invalidate();
    void utils.dashboard.getSummary.invalidate();
  }

  const { confirm, modal } = useConfirmDelete();

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
      </header>

      <div className="mx-auto flex w-screen max-w-screen-md flex-col gap-2 p-5">
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default">
                <span className="sr-only">Open menu</span>
                <PlusIcon />
                Add
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setNewDialogOpen(true)}>
                Add transaction...
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setTemplateDialogOpen(true)}>
                <ZapIcon />
                Quick add...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isPending && <TableSkeleton />}
        {!isPending && (
          <>
            <TransactionTable
              showActions
              data={transactions}
              onDeleteTransaction={(transaction) =>
                confirm({
                  itemType: "transaction",
                  itemName: transaction.description,
                  onConfirm: () => deleteTransaction({ id: transaction.id }),
                })
              }
              onEditTransaction={handleEditTransaction}
              onSaveTemplate={(transaction) =>
                saveTemplate({
                  transactionId: transaction.id,
                })
              }
            />
            {hasNextPage && (
              <Button
                variant="outline"
                size="sm"
                disabled={isFetchingNextPage}
                className="self-center"
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage && <Loader2 className="animate-spin" />}
                Load more
              </Button>
            )}
          </>
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

      <TransactionTemplateDialog
        key={`transaction-template-dialog-${isTemplateDialogOpen}`}
        isOpen={isTemplateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onSuccess={handleTransactionSuccess}
      />

      {modal}
    </>
  );
}
