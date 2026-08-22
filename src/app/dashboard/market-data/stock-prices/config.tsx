/* eslint-disable react-hooks/rules-of-hooks */

import { createColumnHelper } from "@tanstack/react-table";
import { api, type RouterOutputs } from "~/trpc/react";
import { formatDate } from "~/utils/date";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import { toast } from "sonner";
import { useState } from "react";
import { type StockPriceHistory } from "@prisma/client";
import EditStockPriceDialog from "./EditStockPriceDialog";
import { Number } from "~/components/ui/number";

const columnHelper =
  createColumnHelper<RouterOutputs["stockPrice"]["getAll"][number]>();

export const stockPricesColumns = [
  columnHelper.accessor("timestamp", {
    header: "Date",
    cell: ({ getValue }) => {
      return formatDate({
        date: getValue(),
        options: { month: "long", year: "numeric", timeZone: "UTC" },
      });
    },
  }),
  columnHelper.accessor("price", {
    header: "Closing price",
    cell: ({ getValue }) => {
      return (
        <Number
          value={getValue()}
          options={{ maximumFractionDigits: 4 }}
          className="font-medium"
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
    meta: {
      cellClassName: "w-12 text-right",
      headerClassName: "w-12 text-right",
    },
    cell: ({ row }) => {
      const utils = api.useUtils();

      function handleStockChanged() {
        void utils.stockPrice.getAll.invalidate();
        void utils.stockTicker.getAll.invalidate();
        void utils.netWorthOverview.get.invalidate();
        void utils.netWorthAsset.getAll.invalidate();
        void utils.netWorthAsset.getDetailById.invalidate();
        void utils.dashboard.getSummary.invalidate();
      }

      const { mutate: deleteStockPrice } = api.stockPrice.delete.useMutation({
        onSuccess: () => {
          toast.success("Stock price deleted.");
          void handleStockChanged();
        },
      });

      const [editingPrice, setEditingPrice] = useState<StockPriceHistory>();
      const [isEditDialogOpen, setEditDialogOpen] = useState(false);

      const { confirm, modal } = useConfirmDelete();

      function handleEditClick() {
        setEditingPrice(row.original);
        setEditDialogOpen(true);
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-auto h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            <DropdownMenuItem onClick={handleEditClick}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500"
              onClick={() =>
                confirm({
                  itemType: "stock price",
                  itemName: row.original.ticker.ticker,
                  onConfirm: () => deleteStockPrice({ id: row.original.id }),
                })
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
          {modal}
          <EditStockPriceDialog
            key={`edit-stock-price-dialog-${isEditDialogOpen}`}
            isOpen={isEditDialogOpen}
            stockPrice={editingPrice}
            onOpenChange={setEditDialogOpen}
            onSuccess={handleStockChanged}
          />
        </DropdownMenu>
      );
    },
  }),
];
