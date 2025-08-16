/* eslint-disable react-hooks/rules-of-hooks */

import { CashFlow } from "@prisma/client";
import { createColumnHelper } from "@tanstack/react-table";
import { Percentage, RoundedCurrency } from "~/components/ui/number";
import { cn } from "~/lib/utils";
import { formatDate } from "~/utils/date";
import { DECIMAL_ZERO } from "~/utils/number";

const columnHelper = createColumnHelper<CashFlow>();

export const cashFlowColumns = [
  columnHelper.accessor("timestamp", {
    header: "Date",
    cell: ({ getValue }) => {
      return formatDate({ date: getValue() });
    },
  }),
  columnHelper.accessor("income", {
    header: "Income",
    cell: ({ getValue }) => {
      return <RoundedCurrency value={getValue()} />;
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
  columnHelper.accessor("expenses", {
    header: "Expenses",
    cell: ({ getValue }) => {
      return <RoundedCurrency value={getValue()} />;
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
  columnHelper.display({
    header: "Saving rate",
    cell: ({ row }) => {
      const { netFlow, income } = row.original;
      return income.eq(DECIMAL_ZERO) ? (
        "–"
      ) : (
        <Percentage value={netFlow.div(income)} />
      );
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
  columnHelper.accessor("netFlow", {
    header: "Cash flow",
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
