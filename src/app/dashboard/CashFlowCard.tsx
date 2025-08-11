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

export function CashFlowCard() {
  const { data } = api.dashboard.getSummary.useQuery();

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="flex-row justify-between space-y-0 pb-2">
        <CardDescription>Cash flow</CardDescription>
        <TrendIndicator value={data.cashFlowTrend} />
      </CardHeader>

      <CardContent>
        <div className="flex items-end gap-3">
          <CardTitle className="text-3xl">
            <RoundedCurrency value={data.cashFlow?.netFlow} />
          </CardTitle>
        </div>

        <div className="mt-4 flex gap-5">
          <div className="p flex-1">
            <p className="text-sm text-muted-foreground">Income</p>
            <div className="flex items-end gap-3">
              <p className="text-sm font-medium">
                <RoundedCurrency value={data.cashFlow?.income} />
              </p>
            </div>
          </div>

          <div className="p flex-1">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <div className="flex items-end gap-3">
              <p className="text-sm font-medium">
                <RoundedCurrency value={data.cashFlow?.expenses} />
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
