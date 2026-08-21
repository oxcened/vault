"use client";

import { api } from "~/trpc/react";
import { ShieldCheck } from "lucide-react";
import { Duration } from "luxon";
import { DECIMAL_ZERO } from "~/utils/number";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { usePrivacy } from "~/components/privacy";
import { cn } from "~/lib/utils";
import { RoundedCurrency } from "~/components/ui/number";
import Link from "next/link";

export default function FinancialRunway() {
  const { data } = api.dashboard.getSummary.useQuery();
  const { mode } = usePrivacy();

  const averageMonthlyExpenses =
    data?.cashFlowAvgLast6Months.expenses ?? DECIMAL_ZERO;
  const liquidAssets = data?.liquidAssets ?? DECIMAL_ZERO;
  const hasExpenseHistory = averageMonthlyExpenses.gt(0);
  const hasLiquidAssets = liquidAssets.gt(0);

  if (!data?.netWorth) return null;

  const monthsOfRunway = hasExpenseHistory
    ? liquidAssets.div(averageMonthlyExpenses)
    : DECIMAL_ZERO;

  const runwayDuration = Duration.fromObject({
    months: monthsOfRunway.toNumber(),
  }).shiftTo("years", "months", "days");

  let formattedRunwayDuration = !hasLiquidAssets
    ? "Not set up"
    : !hasExpenseHistory
      ? "Unavailable"
      : "Less than a day";

  function formatDurationUnit(value: number, unit: string): string {
    const floored = Math.floor(value);
    return `${floored} ${unit}${floored !== 1 ? "s" : ""}`;
  }

  if (hasLiquidAssets && hasExpenseHistory && runwayDuration.years >= 1) {
    formattedRunwayDuration = formatDurationUnit(runwayDuration.years, "year");
    if (runwayDuration.months >= 1) {
      formattedRunwayDuration += ` ${formatDurationUnit(runwayDuration.months, "month")}`;
    }
  } else if (
    hasLiquidAssets &&
    hasExpenseHistory &&
    runwayDuration.months >= 1
  ) {
    formattedRunwayDuration = formatDurationUnit(
      runwayDuration.months,
      "month",
    );
  } else if (hasLiquidAssets && hasExpenseHistory && runwayDuration.days >= 1) {
    formattedRunwayDuration = formatDurationUnit(runwayDuration.days, "day");
  }

  const runwayProgress = Math.min((monthsOfRunway.toNumber() / 24) * 100, 100);

  return (
    <Card className="relative h-full overflow-hidden bg-gradient-to-br from-card via-card to-amber-500/[0.06] shadow-none">
      <div className="pointer-events-none absolute -right-12 -top-14 size-40 rounded-full bg-amber-500/10 blur-3xl" />
      <CardHeader className="relative flex flex-row items-center gap-3 space-y-0 p-5 pb-0">
        <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/15">
          <ShieldCheck className="size-4" />
        </span>
        <div>
          <CardDescription className="font-medium text-foreground">
            Cash runway
          </CardDescription>
          <p className="text-xs text-muted-foreground">
            How long liquid holdings could cover expenses
          </p>
        </div>
      </CardHeader>

      <CardContent className="relative p-5 pt-5">
        <CardTitle
          className={cn(
            "text-3xl tabular-nums tracking-tight",
            hasLiquidAssets && hasExpenseHistory && mode !== "off" && "blur-md",
            hasLiquidAssets &&
              hasExpenseHistory &&
              mode === "hoverToReveal" &&
              "hover:blur-none",
          )}
        >
          {formattedRunwayDuration}
        </CardTitle>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-background/60 p-3 ring-1 ring-inset ring-border/70">
            <p className="text-xs text-muted-foreground">Liquid assets</p>
            <p className="mt-1 text-sm font-medium">
              <RoundedCurrency value={liquidAssets} />
            </p>
          </div>
          <div className="rounded-lg bg-background/60 p-3 ring-1 ring-inset ring-border/70">
            <p className="text-xs text-muted-foreground">Monthly expenses</p>
            <p className="mt-1 text-sm font-medium">
              <RoundedCurrency value={averageMonthlyExpenses} />
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${runwayProgress}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>Now</span>
            <span>12 months</span>
            <span>24+ months</span>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {!hasLiquidAssets ? (
            <>
              <Link
                href="/dashboard/net-worth/assets"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Mark liquid assets
              </Link>{" "}
              to calculate your runway.
            </>
          ) : !hasExpenseHistory ? (
            "Add expense history to calculate your runway."
          ) : (
            "Based on your six-month average expenses."
          )}
        </p>
      </CardContent>
    </Card>
  );
}
