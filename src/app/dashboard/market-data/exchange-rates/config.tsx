import { createColumnHelper } from "@tanstack/react-table";
import { RoundedCurrency } from "~/components/ui/number";
import { api, RouterOutputs } from "~/trpc/react";
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
import { type ExchangeRate } from "@prisma/client";
import EditExchangeRateDialog from "./EditExchangeRateDialog";

const columnHelper =
  createColumnHelper<RouterOutputs["exchangeRate"]["getAll"][number]>();

export const exchangeRatesColumns = [
  columnHelper.accessor("timestamp", {
    header: "Date",
    cell: ({ getValue }) => {
      return formatDate({ date: getValue() });
    },
  }),
  columnHelper.accessor("baseCurrency", {
    header: "Ticker",
  }),
  columnHelper.accessor("quoteCurrency", {
    header: "Exchange",
  }),
  columnHelper.accessor("rate", {
    header: "Rate",
    cell: ({ getValue }) => {
      return <RoundedCurrency value={getValue()} />;
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

      function handleRateChanged() {
        void utils.exchangeRate.getAll.invalidate();
        void utils.netWorthOverview.get.invalidate();
        void utils.netWorthAsset.getAll.invalidate();
        void utils.netWorthAsset.getDetailById.invalidate();
        void utils.netWorthDebt.getAll.invalidate();
        void utils.netWorthDebt.getDetailById.invalidate();
        void utils.dashboard.getSummary.invalidate();
      }

      const { mutate: deleteExchangeRate } =
        api.exchangeRate.delete.useMutation({
          onSuccess: () => {
            toast.success("Exchange rate deleted.");
            void handleRateChanged();
          },
        });

      const [editingRate, setEditingRate] = useState<ExchangeRate>();
      const [isEditDialogOpen, setEditDialogOpen] = useState(false);

      const { confirm, modal } = useConfirmDelete();

      function handleEditClick() {
        setEditingRate(row.original);
        setEditDialogOpen(true);
      }

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

            <DropdownMenuItem onClick={handleEditClick}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                confirm({
                  itemType: "exchange rate",
                  itemName: `${row.original.baseCurrency} / ${row.original.quoteCurrency}`,
                  onConfirm: () => deleteExchangeRate({ id: row.original.id }),
                })
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
          {modal}
          <EditExchangeRateDialog
            key={`edit-exchange-rate-dialog-${isEditDialogOpen}`}
            isOpen={isEditDialogOpen}
            exchangeRate={editingRate}
            onOpenChange={setEditDialogOpen}
            onSuccess={handleRateChanged}
          />
        </DropdownMenu>
      );
    },
  }),
];
