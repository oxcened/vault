"use client";

import { api } from "~/trpc/react";
import { RoundedCurrency } from "~/components/ui/number";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { TrendIndicator } from "~/components/ui/trend-indicator";

export function NetWorthCard() {
  const { data } = api.dashboard.getSummary.useQuery();

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="flex-row justify-between space-y-0 pb-2">
        <CardDescription>Net worth</CardDescription>
        <TrendIndicator value={data.netWorthTrend} />
      </CardHeader>

      <CardContent>
        <div className="flex items-end gap-3">
          <CardTitle className="text-3xl">
            <RoundedCurrency value={data.netWorth?.netValue} />
          </CardTitle>
        </div>

        <div className="mt-4 flex gap-5">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Assets</p>
            <div className="flex items-end gap-3">
              <p className="text-sm font-medium">
                <RoundedCurrency value={data.netWorth?.totalAssets} />
              </p>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Debts</p>
            <div className="flex items-end gap-3">
              <p className="text-sm font-medium">
                <RoundedCurrency value={data.netWorth?.totalDebts} />
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
