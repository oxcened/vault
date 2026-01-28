/* eslint-disable react-hooks/rules-of-hooks */

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
    header: "Total",
    cell: ({ getValue }) => <RoundedCurrency value={getValue()} />,
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
];
