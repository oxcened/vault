/* eslint-disable react-hooks/rules-of-hooks */

import type { Prisma, TransactionType } from "@prisma/client";
import { createColumnHelper } from "@tanstack/react-table";
import { Currency } from "../ui/number";
import { cn } from "~/lib/utils";
import { formatDate } from "~/utils/date";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { useConfirmDelete } from "../confirm-delete-modal";
import EditTransactionDialog from "~/app/dashboard/cash-flow/transactions/EditTransactionDialog";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export type TransactionRow = {
  id: string;
  timestamp: Date;
  amount: Prisma.Decimal;
  type: TransactionType;
  category: {
    name: string;
  };
  description: string;
  currency: string;
  categoryId: string;
};

const columnHelper = createColumnHelper<TransactionRow>();

export const baseTransactionColumns = [
  columnHelper.accessor("description", {
    header: "Description",
    cell: ({ getValue }) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="max-w-40 truncate">{getValue()}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getValue()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  }),
  columnHelper.accessor("timestamp", {
    header: "Date",
    cell: ({ getValue }) => {
      return formatDate({ date: getValue() });
    },
  }),
  columnHelper.accessor("category.name", {
    header: "Category",
    cell: ({ getValue }) => {
      return <Badge variant="secondary">{getValue()}</Badge>;
    },
  }),
  columnHelper.accessor("amount", {
    header: "Amount",
    cell: ({ getValue, row }) => {
      const isExpense = row.original.type === "EXPENSE";
      const amount = row.original.amount.mul(isExpense ? -1 : 1);

      return (
        <Currency
          value={getValue()}
          options={{
            currency: row.original.currency,
          }}
          className={cn(
            "text-right",
            amount.isPos() && "text-financial-positive",
            amount.isNeg() && "text-financial-negative",
          )}
        />
      );
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
];

export const transactionColumns = [
  ...baseTransactionColumns,
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const utils = api.useUtils();
      const { mutate: saveTemplate } =
        api.transactionTemplate.create.useMutation({
          onSuccess: () => {
            toast.success("Transaction template created.");
            void utils.transactionTemplate.getAll.invalidate();
          },
        });
      const { mutate: deleteTransaction } = api.transaction.delete.useMutation({
        onSuccess: () => {
          toast.success("Transaction deleted.");
          void utils.transaction.getAll.invalidate();
        },
      });
      const { confirm, modal } = useConfirmDelete();
      const [editingTransaction, setEditingTransaction] =
        useState<TransactionRow>();
      const [isEditDialogOpen, setEditDialogOpen] = useState(false);

      const handleEdited = () => {
        void utils.transaction.getAll.invalidate();
        void utils.cashFlow.getMonthlyCashFlow.invalidate();
        void utils.cashFlow.getAll.invalidate();
        void utils.dashboard.getSummary.invalidate();
      };

      const handleEdit = () => {
        setEditingTransaction(row.original);
        setEditDialogOpen(true);
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() => saveTemplate({ transactionId: row.original.id })}
            >
              Save as template
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                confirm({
                  itemType: "transaction",
                  itemName: row.original.description,
                  onConfirm: () => deleteTransaction({ id: row.original.id }),
                })
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
          {modal}
          <EditTransactionDialog
            key={`edit-transaction-dialog-${isEditDialogOpen}`}
            isOpen={isEditDialogOpen}
            transaction={editingTransaction}
            onOpenChange={setEditDialogOpen}
            onSuccess={handleEdited}
          />
        </DropdownMenu>
      );
    },
  }),
];
