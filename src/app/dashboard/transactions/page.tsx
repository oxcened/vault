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
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { formatDate } from "~/utils/date";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal, Plus } from "lucide-react";
import { TableSkeleton } from "~/components/table-skeleton";
import { toast } from "sonner";
import { Currency } from "~/components/ui/number";
import { cn } from "~/lib/utils";
import NewTransactionDialog from "./NewTransactionDialog";
import { useBreakpoint } from "~/hooks/useBreakpoint";

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
          <span className="hidden md:inline">New transaction</span>
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
          <div>
            <Table className="whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => {
                  const isIncome = row.type === "INCOME";
                  const isExpense = row.type === "EXPENSE";
                  const amount = row.amount.mul(isExpense ? -1 : 1);

                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span>
                          {formatDate({
                            date: row.timestamp,
                            options: md
                              ? undefined
                              : {
                                  dateStyle: undefined,
                                  day: "numeric",
                                  month: "2-digit",
                                  year: undefined,
                                },
                          })}
                        </span>
                      </TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {row.category.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Currency
                          value={amount}
                          options={{
                            currency: row.currency,
                            maximumFractionDigits: md ? 2 : 0,
                          }}
                          className={cn(
                            isIncome && "text-green-600",
                            isExpense && "text-red-600",
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => deleteTransaction(row)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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
