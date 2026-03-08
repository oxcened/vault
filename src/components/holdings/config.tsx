/* eslint-disable react-hooks/rules-of-hooks */

import { createColumnHelper } from "@tanstack/react-table";
import { Number, RoundedCurrency, RoundedNumber } from "~/components/ui/number";
import { formatDate } from "~/utils/date";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button, buttonVariants } from "~/components/ui/button";
import { ArchiveIcon, HelpCircleIcon, MoreHorizontalIcon } from "lucide-react";
import { Holding } from "./net-worth-holdings";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
          {row.original.archivedAt && <ArchiveIcon />}
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

      const onPoolToEnvelopesHolding =
        tableMeta &&
        "onPoolToEnvelopesHolding" in tableMeta &&
        typeof tableMeta.onPoolToEnvelopesHolding === "function"
          ? (tableMeta.onPoolToEnvelopesHolding as (holding: Holding) => void)
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

      const { quantity, poolInEnvelopes, archivedAt } = row.original;
      const isArchiveDisabled = !!quantity && !quantity.eq(0);

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
            {poolInEnvelopes != null && (
              <DropdownMenuCheckboxItem
                checked={poolInEnvelopes === true}
                onClick={() => onPoolToEnvelopesHolding?.(row.original)}
              >
                Include in envelope pool
              </DropdownMenuCheckboxItem>
            )}

            <div className="flex items-center gap-1">
              <DropdownMenuItem
                className="flex-1"
                disabled={isArchiveDisabled}
                onClick={() => onArchiveHolding?.(row.original)}
              >
                {archivedAt ? "Unarchive" : "Archive"}
              </DropdownMenuItem>

              {isArchiveDisabled && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircleIcon className="mr-2 size-4 opacity-50" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Quantity must be 0 to archive.
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

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
