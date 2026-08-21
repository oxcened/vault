import type {
  Prisma,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { createColumnHelper, type Row } from "@tanstack/react-table";
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
import NewTransactionDialog from "~/app/dashboard/cash-flow/transactions/NewTransactionDialog";
import { type CreateTransaction } from "~/trpc/schemas/transaction";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { TransactionIcon } from "./transaction-icon";

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
  status: TransactionStatus;
};

const columnHelper = createColumnHelper<TransactionRow>();

function ActionsCell({ row }: { row: Row<TransactionRow> }) {
  const utils = api.useUtils();
  const { mutate: saveTemplate } = api.transactionTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("Transaction template created.");
      void utils.transactionTemplate.getAll.invalidate();
    },
  });
  const { mutate: deleteTransaction } = api.transaction.delete.useMutation({
    onSuccess: () => {
      toast.success("Transaction deleted.");
      handleEdited();
    },
  });
  const { confirm, modal } = useConfirmDelete();
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionRow>();
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isOppositeDialogOpen, setOppositeDialogOpen] = useState(false);

  const oppositeTransaction: CreateTransaction = {
    amount: row.original.amount.mul(-1).toNumber(),
    type: row.original.type,
    categoryId: row.original.categoryId,
    currency: row.original.currency,
    description: row.original.description,
    timestamp: new Date(),
    status: "POSTED",
  };

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
          Save to quick add
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setOppositeDialogOpen(true)}>
          {row.original.type === "EXPENSE" && row.original.amount.isPos()
            ? "Add refund"
            : "Add opposite transaction"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-500"
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
      <NewTransactionDialog
        key={`opposite-transaction-dialog-${isOppositeDialogOpen}`}
        isOpen={isOppositeDialogOpen}
        initialData={oppositeTransaction}
        title={
          row.original.type === "EXPENSE" && row.original.amount.isPos()
            ? "Add refund"
            : "Add opposite transaction"
        }
        onOpenChange={setOppositeDialogOpen}
        onSuccess={handleEdited}
      />
    </DropdownMenu>
  );
}

// Single source of truth for column definitions.
const columnsByKey = {
  description: columnHelper.accessor("description", {
    header: "Description",
    cell: ({ getValue, row }) => {
      const transaction = row.original;

      return (
        <div className="flex items-center gap-3">
          <TransactionIcon
            category={transaction.category.name}
            type={transaction.type}
            isRefund={
              transaction.type === "EXPENSE" && transaction.amount.isNeg()
            }
          />
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
        </div>
      );
    },
    enableSorting: false,
  }),
  date: columnHelper.accessor("timestamp", {
    header: "Date",
    cell: ({ getValue }) => {
      return formatDate({ date: getValue() });
    },
    enableSorting: true,
  }),
  category: columnHelper.accessor("category.name", {
    header: "Category",
    cell: ({ getValue }) => {
      return <Badge variant="secondary">{getValue()}</Badge>;
    },
    enableSorting: false,
  }),
  type: columnHelper.accessor("type", {
    header: "Type",
    cell: ({ getValue }) => {
      return (
        <Badge variant="secondary" className="capitalize">
          {getValue().toLocaleLowerCase()}
        </Badge>
      );
    },
    enableSorting: false,
  }),
  status: columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      return (
        <Badge variant="secondary" className="capitalize">
          {getValue().toLocaleLowerCase()}
        </Badge>
      );
    },
    enableSorting: false,
  }),
  amount: columnHelper.accessor("amount", {
    header: "Amount",
    cell: ({ getValue, row }) => {
      const isExpense = row.original.type === "EXPENSE";
      const amount = getValue().mul(isExpense ? -1 : 1);

      return (
        <Currency
          value={amount}
          options={{
            currency: row.original.currency,
            signDisplay: "always",
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
    enableSorting: false,
  }),
  actions: columnHelper.display({
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} />,
    enableSorting: false,
  }),
} as const;

type ColumnKey = keyof typeof columnsByKey;
const buildColumns = (keys: ColumnKey[]) => keys.map((k) => columnsByKey[k]);

export const baseTransactionColumns = buildColumns([
  "description",
  "date",
  "category",
  "amount",
]);

export const transactionColumns = buildColumns([
  "description",
  "date",
  "category",
  "type",
  "status",
  "amount",
  "actions",
]);
