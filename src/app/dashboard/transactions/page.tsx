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
import { Plus } from "lucide-react";
import { TableSkeleton } from "~/components/table-skeleton";
import { toast } from "sonner";
import NewTransactionDialog from "./NewTransactionDialog";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import { TransactionTable } from "~/components/transaction-table";

export default function TransactionsPage() {
  const { data = [], refetch, isPending } = api.transaction.getAll.useQuery();

  const { mutate: deleteTransaction } = api.transaction.delete.useMutation({
    onSuccess: () => {
      toast.success("Transaction deleted.");
      void refetch();
    },
  });

  const [isNewTransaction, setNewTransaction] = useState(false);

  const { md } = useBreakpoint();

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/net-worth">
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
          size={md ? "default" : "icon"}
          onClick={() => setNewTransaction(true)}
        >
          <Plus />
          <span className="hidden md:inline">Transaction</span>
        </Button>
      </header>

      <div className="mx-auto w-screen max-w-screen-md p-5">
        {isPending && <TableSkeleton />}
        {!isPending && !data.length && (
          <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don't have any transactions yet
          </div>
        )}
        {!isPending && !!data.length && (
          <TransactionTable
            showActions
            data={data}
            onDeleteTransaction={(id) => deleteTransaction({ id })}
          />
        )}
      </div>

      <NewTransactionDialog
        isOpen={isNewTransaction}
        onOpenChange={setNewTransaction}
        onSuccess={refetch}
      />
    </>
  );
}
