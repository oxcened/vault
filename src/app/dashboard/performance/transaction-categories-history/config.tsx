/* eslint-disable react-hooks/rules-of-hooks */

import Decimal from "decimal.js";
import { type Prisma } from "@prisma/client";
import { createColumnHelper } from "@tanstack/react-table";
import { RoundedCurrency } from "~/components/ui/number";

export type TransactionCategoryAggregate = {
  categoryId: string;
  categoryName: string;
  categoryType: "INCOME" | "EXPENSE" | "TRANSFER";
  totalAmount: Prisma.Decimal;
  transactionCount: number;
};

const columnHelper = createColumnHelper<TransactionCategoryAggregate>();

export const transactionCategoryColumns = [
  columnHelper.accessor("categoryName", {
    header: "Category",
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor("transactionCount", {
    header: "Transactions",
    cell: ({ getValue }) => getValue(),
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
  columnHelper.accessor("totalAmount", {
    header: "Amount",
    cell: ({ getValue }) => <RoundedCurrency value={getValue()} />,
    footer: ({ table }) => {
      const total = table.getRowModel().rows.reduce((sum, row) => {
        const value = row.getValue("totalAmount");

        if (value === null || value === undefined) {
          return sum;
        }

        if (Decimal.isDecimal(value)) {
          return sum.plus(value);
        }

        try {
          return sum.plus(new Decimal(value as Decimal.Value));
        } catch {
          return sum;
        }
      }, new Decimal(0));

      return <RoundedCurrency value={total} />;
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
      footerClassName: "text-right",
    },
  }),
];
