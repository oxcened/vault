/* eslint-disable react-hooks/rules-of-hooks */

import { createColumnHelper } from "@tanstack/react-table";
import { RoundedCurrency } from "~/components/ui/number";
import { NetWorthHoldingsHistoryRow } from "./net-worth-holdings-history";
import { Badge } from "../ui/badge";

const columnHelper = createColumnHelper<NetWorthHoldingsHistoryRow>();

export const holdingHistoryColumns = [
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("categoryName", {
    header: "Category",
    cell: ({ getValue }) => {
      return <Badge variant="secondary">{getValue()}</Badge>;
    },
  }),
  columnHelper.accessor("value", {
    header: "Value",
    cell: ({ getValue }) => {
      return <RoundedCurrency value={getValue()} />;
    },
    meta: {
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
  }),
];
