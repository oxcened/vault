import { NetWorthCategory } from "@prisma/client";
import { Holding } from "./net-worth-holdings";
import Decimal from "decimal.js";
import {
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { useTable } from "~/hooks/useTable";
import { holdingsColumns } from "./config";
import { Button } from "../ui/button";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { RoundedCurrency } from "../ui/number";
import { DataTableColumns } from "../ui/data-table-columns";
import { DataTable } from "../ui/data-table";

export function CategoryTable<T extends Holding>({
  holdings,
  category,
  total,
  onEditHolding,
  onDeleteHolding,
  onArchiveHolding,
}: {
  holdings: T[];
  category: NetWorthCategory;
  total: Decimal;
  onEditHolding: (holding: T) => void;
  onDeleteHolding: (holding: T) => void;
  onArchiveHolding: (holding: T) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "valueInTarget",
      desc: true,
    },
  ]);

  const table = useTable({
    data: holdings,
    columns: holdingsColumns({ isStock: category.isStock }),
    getCoreRowModel: getCoreRowModel(),
    meta: {
      id: "exchangeRates",
      onEditHolding,
      onDeleteHolding,
      onArchiveHolding,
    },
    initialState: {
      columnVisibility: {
        archivedAt: false,
        fxRate: false,
        stockPrice: category.isStock,
        stockTicker: false,
        currency: false,
        quantity: category.isStock,
      },
    },
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
  });

  const [isOpen, setOpen] = useState(true);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((state) => !state)}
        >
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </Button>

        <div className="mr-auto">
          <p className="text-sm text-muted-foreground">{category.name}</p>
          <RoundedCurrency value={total} className="text-sm font-medium" />
        </div>
        <DataTableColumns table={table} />
      </div>

      {isOpen && (
        <>
          <DataTable table={table} />
        </>
      )}
    </div>
  );
}
