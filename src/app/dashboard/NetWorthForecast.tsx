"use client";

import { api } from "~/trpc/react";
import { ChartNoAxesCombined } from "lucide-react";
import { DECIMAL_ZERO } from "~/utils/number";
import { RoundedCurrency } from "~/components/ui/number";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";

export default function NetWorthForecast() {
  const { data } = api.dashboard.getSummary.useQuery();
  const averageMonthlyCashFlow =
    data?.cashFlowAvgLast6Months.netFlow ?? DECIMAL_ZERO;
  const projectedChange = averageMonthlyCashFlow.mul(12);

  const netWorthForecast =
    data?.netWorth?.netValue.plus(projectedChange) ?? DECIMAL_ZERO;

  if (!data?.netWorth) return null;

  return (
    <Card className="relative h-full overflow-hidden bg-gradient-to-br from-card via-card to-violet-500/[0.06] shadow-none">
      <div className="pointer-events-none absolute -right-12 -top-14 size-40 rounded-full bg-violet-500/10 blur-3xl" />
      <CardHeader className="relative flex flex-row items-center gap-3 space-y-0 p-5 pb-0">
        <span className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 ring-1 ring-inset ring-violet-500/15">
          <ChartNoAxesCombined className="size-4" />
        </span>
        <div>
          <CardDescription className="font-medium text-foreground">
            12-month projection
          </CardDescription>
          <p className="text-xs text-muted-foreground">Estimated net worth</p>
        </div>
      </CardHeader>

      <CardContent className="relative p-5 pt-5">
        <CardTitle className="text-3xl tracking-tight">
          <RoundedCurrency value={netWorthForecast} />
        </CardTitle>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-background/60 p-3 ring-1 ring-inset ring-border/70">
            <p className="text-xs text-muted-foreground">Projected change</p>
            <p
              className={cn(
                "mt-1 text-sm font-medium",
                projectedChange.gt(0) && "text-financial-positive",
                projectedChange.lt(0) && "text-financial-negative",
              )}
            >
              <RoundedCurrency
                value={projectedChange}
                options={{ signDisplay: "always" }}
              />
            </p>
          </div>
          <div className="rounded-lg bg-background/60 p-3 ring-1 ring-inset ring-border/70">
            <p className="text-xs text-muted-foreground">Monthly average</p>
            <p className="mt-1 text-sm font-medium">
              <RoundedCurrency value={averageMonthlyCashFlow} />
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Assumes your six-month average cash flow continues.
        </p>
      </CardContent>
    </Card>
  );
}
