"use client";

import { useState } from "react";
import NetWorthHoldingsHistory from "~/components/net-worth-holdings-history";
import { api } from "~/trpc/react";

export default function AssetsHistoryPage() {
  const [date, setDate] = useState<Date>(
    new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    ),
  );

  const { data = [], isPending } = api.netWorthDebt.getAll.useQuery(
    {
      date,
    },
    {
      select: (data) =>
        data.map((row) => ({
          id: row.debtId,
          name: row.debtName,
          categoryName: row.categoryName,
          value: row.valueInTarget,
        })),
    },
  );

  return (
    <NetWorthHoldingsHistory
      data={data}
      isFetching={isPending}
      date={date}
      type="debt"
      onDateChange={setDate}
    />
  );
}
