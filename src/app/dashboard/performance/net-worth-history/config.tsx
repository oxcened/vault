/* eslint-disable react-hooks/rules-of-hooks */

import { NetWorth } from "@prisma/client";
import { createColumnHelper } from "@tanstack/react-table";
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
