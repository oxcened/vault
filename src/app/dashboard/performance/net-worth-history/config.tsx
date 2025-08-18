/* eslint-disable react-hooks/rules-of-hooks */

import { type NetWorth } from "@prisma/client";
import { createColumnHelper, Row } from "@tanstack/react-table";
import { RoundedCurrency } from "~/components/ui/number";
import { cn } from "~/lib/utils";
import { formatDate } from "~/utils/date";

const columnHelper = createColumnHelper<NetWorth>();

export const netWorthColumns = [
  columnHelper.accessor("timestamp", {
    header: "Date",
    cell: ({ getValue }) => {
      return formatDate({ date: getValue() });
    },
  }),
  columnHelper.accessor("totalAssets", {
    header: "Assets",
    cell: ({ getValue }) => {
      return <RoundedCurrency value={getValue()} />;
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
  columnHelper.accessor("totalDebts", {
    header: "Debts",
    cell: ({ getValue }) => {
      return <RoundedCurrency value={getValue()} />;
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
  columnHelper.display({
    header: "Change",
    cell: ({ table, row }) => {
      let prevRow: Row<NetWorth> | undefined;

      try {
        prevRow = table.getRow((row.index + 1).toString());
      } catch (e) {
        prevRow = undefined;
      }

      const change = prevRow
        ? row.original.netValue.minus(prevRow.original.netValue)
        : undefined;

      return prevRow && !prevRow.original.netValue.eq(0) && change ? (
        <RoundedCurrency
          value={change}
          options={{
            signDisplay: "always",
          }}
          className={cn(
            change.isPos() && "text-financial-positive",
            change.isNeg() && "text-financial-negative",
          )}
        />
      ) : (
        "–"
      );
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
  columnHelper.accessor("netValue", {
    header: "Net worth",
    cell: ({ getValue }) => {
      return (
        <RoundedCurrency
          value={getValue()}
          className={cn(
            getValue().isPos() && "text-financial-positive",
            getValue().isNeg() && "text-financial-negative",
          )}
        />
      );
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
];
