/* eslint-disable react-hooks/rules-of-hooks */

import { createColumnHelper, Row } from "@tanstack/react-table";
import { Currency, Number } from "~/components/ui/number";
import { ValueHistoryRow } from "./holding-detail";
import { formatDate } from "~/utils/date";
import { DataSourceBadge } from "./data-source-badge";
import { DeltaPopup } from "./delta-popup";
import { ValueChangePopup } from "./value-change-popup";
import { cn } from "~/lib/utils";
import { ValuePopup } from "./value-popup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "../ui/button";
import { useConfirmDelete } from "../confirm-delete-modal";

const columnHelper = createColumnHelper<ValueHistoryRow>();

export const holdingDetailColumn = [
  columnHelper.accessor("timestamp", {
    header: "Date",
    cell: ({ getValue }) => {
      return getValue() ? formatDate({ date: getValue() }) : "n/a";
    },
  }),
  columnHelper.display({
    header: "Data sources",
    cell: ({ row, table }) => {
      const {
        quantity,
        stockPrice,
        fxRate,
        quantityIsCarried,
        stockPriceIsCarried,
        fxRateIsCarried,
      } = row.original;
      let previousRow: Row<ValueHistoryRow> | undefined;

      try {
        previousRow = table.getRow((row.index + 1).toString());
      } catch (e) {
        previousRow = undefined;
      }

      return (
        <div className="flex gap-1">
          {quantity && (
            <DataSourceBadge label="Qty" isCarried={quantityIsCarried} />
          )}
          {stockPrice && (
            <DataSourceBadge label="Stock" isCarried={stockPriceIsCarried} />
          )}
          {fxRate && <DataSourceBadge label="FX" isCarried={fxRateIsCarried} />}

          <DeltaPopup row={row.original} previousRow={previousRow?.original} />
        </div>
      );
    },
  }),
  columnHelper.display({
    header: "Change",
    cell: ({ row, table }) => {
      let previousRow: Row<ValueHistoryRow> | undefined;

      try {
        previousRow = table.getRow((row.index + 1).toString());
      } catch (e) {
        previousRow = undefined;
      }

      const previousDelta = previousRow
        ? row.original.valueInTarget.minus(previousRow.original.valueInTarget)
        : undefined;

      return (
        <>
          {previousDelta && previousRow ? (
            <div className="inline-flex w-fit items-center gap-1">
              <Currency
                value={previousDelta}
                className={cn(
                  previousDelta.isPos() && "text-financial-positive",
                  previousDelta.isNeg() && "text-financial-negative",
                )}
                options={{
                  signDisplay: "always",
                }}
              />

              <ValueChangePopup
                row={row.original}
                previousRow={previousRow.original}
              />
            </div>
          ) : (
            "–"
          )}
        </>
      );
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
  columnHelper.accessor("quantity", {
    header: "Quantity",
    cell: ({ getValue }) => {
      return (
        <Number
          value={getValue()}
          options={{
            maximumFractionDigits: 2,
          }}
        />
      );
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
  columnHelper.accessor("stockPrice", {
    header: "Stock",
    cell: ({ getValue }) => {
      return (
        <Number
          value={getValue()}
          options={{
            maximumFractionDigits: 2,
          }}
        />
      );
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
  columnHelper.accessor("fxRate", {
    header: "FX",
    cell: ({ getValue }) => {
      return <Number value={getValue()} />;
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
  columnHelper.accessor("valueInTarget", {
    header: "Value",
    cell: ({ row }) => {
      const { valueInTarget } = row.original;
      return (
        <div className="inline-flex w-fit items-center gap-1">
          <Currency value={valueInTarget} />
          <ValuePopup row={row.original} />
        </div>
      );
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row, table }) => {
      const { quantityIsCarried, quantityId, timestamp } = row.original;
      const { confirm, modal } = useConfirmDelete();
      const tableMeta = table.options.meta;

      const onQuantityEdit =
        tableMeta &&
        "onQuantityEdit" in tableMeta &&
        typeof tableMeta.onQuantityEdit === "function"
          ? tableMeta.onQuantityEdit
          : undefined;

      const onQuantityDelete =
        tableMeta &&
        "onQuantityDelete" in tableMeta &&
        typeof tableMeta.onQuantityDelete === "function"
          ? tableMeta.onQuantityDelete
          : undefined;

      return (
        <>
          {quantityId && !quantityIsCarried && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    onQuantityEdit?.({
                      id: quantityId!,
                    })
                  }
                >
                  Edit quantity
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() =>
                    confirm({
                      itemType: "value",
                      itemName: formatDate({ date: timestamp }),
                      onConfirm: () => onQuantityDelete?.({ timestamp }),
                    })
                  }
                >
                  Delete quantity
                </DropdownMenuItem>
              </DropdownMenuContent>
              {modal}
            </DropdownMenu>
          )}
        </>
      );
    },
  }),
];
