/* eslint-disable react-hooks/rules-of-hooks */

import { createColumnHelper } from "@tanstack/react-table";
import { api } from "~/trpc/react";
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
import { StockTicker } from "@prisma/client";

const columnHelper = createColumnHelper<StockTicker>();

export const stockTickerColumns = [
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("ticker", {
    header: "Ticker",
  }),
  columnHelper.accessor("exchange", {
    header: "Exchange",
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const utils = api.useUtils();

      const { mutate: deleteStockTicker } = api.stockTicker.delete.useMutation({
        onSuccess: () => {
          toast.success("Stock ticker deleted.");
          void utils.stockTicker.getAll.invalidate();
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
                  itemType: "stock ticker",
                  onConfirm: () =>
                    deleteStockTicker({
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
