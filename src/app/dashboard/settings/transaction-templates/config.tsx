/* eslint-disable react-hooks/rules-of-hooks */

import { createColumnHelper } from "@tanstack/react-table";
import { Currency } from "~/components/ui/number";
import { api, type RouterOutputs } from "~/trpc/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import { useConfirmDelete } from "~/components/confirm-delete-modal";

const columnHelper =
  createColumnHelper<RouterOutputs["transactionTemplate"]["getAll"][number]>();

export const transactionTemplateColumns = [
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
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const utils = api.useUtils();

      const { mutate: deleteTransaction } =
        api.transactionTemplate.delete.useMutation({
          onSuccess: () => {
            toast.success("Transaction template deleted.");
            void utils.transactionTemplate.getAll.invalidate();
          },
        });
      const { confirm, modal } = useConfirmDelete();

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
        </DropdownMenu>
      );
    },
  }),
];
