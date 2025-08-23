/* eslint-disable react-hooks/rules-of-hooks */

import { createColumnHelper } from "@tanstack/react-table";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
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
import { TransactionCategory } from "@prisma/client";

const columnHelper = createColumnHelper<TransactionCategory>();

export const transactionCategoryColumns = [
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("type", {
    header: "Type",
    cell: ({ getValue }) => {
      return (
        <Badge variant="secondary" className="capitalize">
          {getValue().toLowerCase()}
        </Badge>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const utils = api.useUtils();

      const { mutate: deleteCategory } =
        api.transactionCategory.delete.useMutation({
          onSuccess: () => {
            toast.success("Transaction category deleted.");
            void utils.transactionCategory.getAll.invalidate();
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
                  itemName: row.original.name,
                  itemType: "category",
                  onConfirm: () =>
                    deleteCategory({
                      id: row.original.id,
                    }),
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
