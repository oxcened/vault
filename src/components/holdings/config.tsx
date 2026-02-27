/* eslint-disable react-hooks/rules-of-hooks */

import { createColumnHelper } from "@tanstack/react-table";
import { Number, RoundedCurrency, RoundedNumber } from "~/components/ui/number";
import { formatDate } from "~/utils/date";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button, buttonVariants } from "~/components/ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { Holding } from "./net-worth-holdings";
import { Badge } from "../ui/badge";
import Link from "next/link";

const columnHelper = createColumnHelper<Holding>();

export const holdingsColumns = ({ isStock = false }: { isStock?: boolean }) => [
  columnHelper.accessor("name", {
    header: "Name",
    cell: ({ getValue, row, table }) => {
      const tableMeta = table.options.meta;

      const getDetailUrl =
        tableMeta &&
        "getHoldingDetailUrl" in tableMeta &&
        typeof tableMeta.getHoldingDetailUrl === "function"
          ? (tableMeta.getHoldingDetailUrl as (holding: Holding) => string)
          : undefined;

      return (
        <Link
          href={getDetailUrl?.(row.original) ?? ""}
          className={buttonVariants({
            variant: "link",
          })}
        >
          {getValue()}
        </Link>
      );
    },
  }),
  columnHelper.accessor("quantity", {
    header: "Quantity",
    cell: ({ getValue }) => {
      if (!getValue()) return "–";

      return <RoundedNumber value={getValue()} />;
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
    enableSorting: false,
  }),
  ...(isStock
    ? [
        columnHelper.accessor("stockPrice", {
          header: "Stock price",
          cell: ({ getValue, row }) => {
            if (!getValue()) return "–";

            return (
              <RoundedCurrency
                value={getValue()}
                options={{
                  currency: row.original.currency,
                }}
              />
            );
          },
          meta: {
            cellClassName: "text-right",
            headerClassName: "text-right",
          },
          enableSorting: false,
        }),
        columnHelper.accessor("stockTicker", {
          header: "Stock ticker",
          cell: ({ getValue }) => {
            if (!getValue()) return "–";

            return getValue();
          },
          meta: {
            cellClassName: "text-right",
            headerClassName: "text-right",
          },
          enableSorting: false,
        }),
      ]
    : []),
  columnHelper.accessor("fxRate", {
    header: "FX rate",
    cell: ({ getValue }) => {
      if (!getValue()) return "–";

      return <Number value={getValue()} />;
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
    enableSorting: false,
  }),
  columnHelper.accessor("currency", {
    header: "Currency",
    cell: ({ getValue }) => {
      if (!getValue()) return "–";

      return <Badge variant="secondary">{getValue()}</Badge>;
    },
  }),

  columnHelper.accessor("archivedAt", {
    header: "Archived",
    cell: ({ getValue }) => {
      const date = getValue();
      if (!date) return "–";

      return formatDate({ date });
    },
  }),
  columnHelper.accessor("timestamp", {
    header: "Updated",
    cell: ({ getValue }) => {
      return formatDate({ date: getValue() });
    },
  }),
  columnHelper.accessor("valueInTarget", {
    header: "Value",
    cell: ({ getValue }) => {
      if (!getValue()) return "–";

      return <RoundedCurrency value={getValue()} />;
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
    sortingFn: (rowA, rowB) => {
      return rowA.original.valueInTarget
        .minus(rowB.original.valueInTarget)
        .toNumber();
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row, table }) => {
      const tableMeta = table.options.meta;

      const onEditHolding =
        tableMeta &&
        "onEditHolding" in tableMeta &&
        typeof tableMeta.onEditHolding === "function"
          ? (tableMeta.onEditHolding as (holding: Holding) => void)
          : undefined;

      const onArchiveHolding =
        tableMeta &&
        "onArchiveHolding" in tableMeta &&
        typeof tableMeta.onArchiveHolding === "function"
          ? (tableMeta.onArchiveHolding as (holding: Holding) => void)
          : undefined;

      const onDeleteHolding =
        tableMeta &&
        "onDeleteHolding" in tableMeta &&
        typeof tableMeta.onDeleteHolding === "function"
          ? (tableMeta.onDeleteHolding as (holding: Holding) => void)
          : undefined;

      const { quantity } = row.original;

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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEditHolding?.(row.original)}>
              Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!!quantity && !quantity.eq(0)}
              onClick={() => onArchiveHolding?.(row.original)}
            >
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => onDeleteHolding?.(row.original)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
];
