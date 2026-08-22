import type {
  Prisma,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
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
import EditTransactionDialog from "~/app/dashboard/transactions/EditTransactionDialog";
import NewTransactionDialog from "~/app/dashboard/transactions/NewTransactionDialog";
import { type CreateTransaction } from "~/trpc/schemas/transaction";
import { useState } from "react";
import { addMonths } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { TransactionIcon } from "./transaction-icon";
import { RecurringTransactionDialog } from "~/app/dashboard/transactions/RecurringTransactionDialog";
import type { RecurringTransactionInput } from "~/trpc/schemas/recurring-transaction";
import { RecurrenceFrequency } from "@prisma/client";
import { Checkbox } from "../ui/checkbox";

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

export function TransactionActions({
  transaction,
  showEdit = true,
  showTriggerLabel = false,
  onDeleted,
}: {
  transaction: TransactionRow;
  showEdit?: boolean;
  showTriggerLabel?: boolean;
  onDeleted?: () => void;
}) {
  const utils = api.useUtils();
  const { mutate: saveTemplate } = api.transactionTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("Preset saved.");
      void utils.transactionTemplate.getAll.invalidate();
      void utils.transactionTemplate.getFrequent.invalidate();
    },
  });
  const { mutate: deleteTransaction } = api.transaction.delete.useMutation({
    onSuccess: () => {
      toast.success("Transaction deleted.");
      handleEdited();
      onDeleted?.();
    },
  });
  const { confirm, modal } = useConfirmDelete();
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionRow>();
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isOppositeDialogOpen, setOppositeDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const oppositeTransaction: CreateTransaction = {
    amount: transaction.amount.mul(-1).toNumber(),
    type: transaction.type,
    categoryId: transaction.categoryId,
    currency: transaction.currency,
    description: transaction.description,
    timestamp: new Date(),
    status: "POSTED",
  };
  const recurringTransaction: RecurringTransactionInput = {
    amount: transaction.amount.toNumber(),
    type: transaction.type,
    categoryId: transaction.categoryId,
    currency: transaction.currency,
    description: transaction.description,
    nextDate: addMonths(new Date(), 1),
    frequency: RecurrenceFrequency.MONTHLY,
    interval: 1,
  };

  const handleEdited = () => {
    void utils.transaction.getAll.invalidate();
    void utils.cashFlow.getMonthlyCashFlow.invalidate();
    void utils.cashFlow.getAll.invalidate();
    void utils.dashboard.getSummary.invalidate();
  };

  const handleEdit = () => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={showTriggerLabel ? "outline" : "ghost"}
          className={showTriggerLabel ? undefined : "h-8 w-8 p-0"}
        >
          {!showTriggerLabel && <span className="sr-only">Open menu</span>}
          <MoreHorizontalIcon />
          {showTriggerLabel && "More"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => saveTemplate({ transactionId: transaction.id })}
        >
          Save as preset
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setScheduleDialogOpen(true)}>
          Make recurring
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setOppositeDialogOpen(true)}>
          {transaction.type === "EXPENSE" && transaction.amount.isPos()
            ? "Add refund"
            : "Add opposite transaction"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {showEdit && (
          <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-red-500"
          onClick={() =>
            confirm({
              itemType: "transaction",
              itemName: transaction.description,
              onConfirm: () => deleteTransaction({ id: transaction.id }),
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
          transaction.type === "EXPENSE" && transaction.amount.isPos()
            ? "Add refund"
            : "Add opposite transaction"
        }
        onOpenChange={setOppositeDialogOpen}
        onSuccess={handleEdited}
      />
      <RecurringTransactionDialog
        key={`transaction-schedule-dialog-${transaction.id}-${isScheduleDialogOpen}`}
        isOpen={isScheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        initialData={recurringTransaction}
        onSuccess={() => {
          void utils.recurringTransaction.getAll.invalidate();
        }}
      />
    </DropdownMenu>
  );
}

// Single source of truth for column definitions.
const columnsByKey = {
  description: columnHelper.accessor("description", {
    header: ({ table }) => (
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(checked === true)
            }
            aria-label="Select all transactions on this page"
          />
        </span>
        Description
      </div>
    ),
    cell: ({ getValue, row }) => {
      const transaction = row.original;

      return (
        <div className="flex items-center gap-3">
          <div className="group/transaction-select relative size-9 shrink-0">
            <div
              className={cn(
                "transition-opacity group-hover/transaction-select:opacity-0",
                row.getIsSelected() && "opacity-0",
              )}
            >
              <TransactionIcon
                category={transaction.category.name}
                type={transaction.type}
                isRefund={
                  transaction.type === "EXPENSE" && transaction.amount.isNeg()
                }
              />
            </div>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(checked) =>
                row.toggleSelected(checked === true)
              }
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/transaction-select:opacity-100",
                row.getIsSelected() && "opacity-100",
              )}
              aria-label={`Select ${transaction.description}`}
            />
          </div>
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
  dashboardDescription: columnHelper.accessor("description", {
    id: "description",
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
    cell: ({ row }) => <TransactionActions transaction={row.original} />,
    enableSorting: false,
  }),
} as const;

type ColumnKey = keyof typeof columnsByKey;
const buildColumns = (keys: ColumnKey[]) => keys.map((k) => columnsByKey[k]);

export const baseTransactionColumns = buildColumns([
  "dashboardDescription",
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
