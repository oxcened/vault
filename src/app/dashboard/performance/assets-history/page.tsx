"use client";

import { useState } from "react";
import NetWorthHoldingsHistory from "~/components/netWorthHoldingHistory/net-worth-holdings-history";
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

  const { data = [], isPending } = api.netWorthAsset.getAll.useQuery(
    {
      date,
    },
    {
      select: (data) =>
        data.map((row) => ({
          id: row.assetId,
          name: row.assetName,
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
      type="asset"
      onDateChange={setDate}
    />
  );
}
