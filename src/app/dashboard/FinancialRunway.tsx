"use client";

import { api } from "~/trpc/react";
import { HelpCircleIcon, PiggyBank } from "lucide-react";
import { Duration } from "luxon";
import { DECIMAL_ZERO } from "~/utils/number";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export default function FinancialRunway() {
  const { data } = api.dashboard.getSummary.useQuery();

  const monthsOfRunway =
    data?.netWorth?.totalAssets.div(
      data.cashFlowAvgLast6Months.expenses ?? DECIMAL_ZERO,
    ) ?? DECIMAL_ZERO;

  const runwayDuration = Duration.fromObject({
    months: monthsOfRunway.toNumber(),
  }).shiftTo("years", "months", "days");

  let formattedRunwayDuration = "";

  function formatDurationUnit(value: number, unit: string): string {
    const floored = Math.floor(value);
    return `${floored} ${unit}${floored !== 1 ? "s" : ""}`;
  }

  if (runwayDuration.years >= 1) {
    formattedRunwayDuration = formatDurationUnit(runwayDuration.years, "year");
  } else if (runwayDuration.months >= 1) {
    formattedRunwayDuration = formatDurationUnit(
      runwayDuration.months,
      "month",
    );
  } else if (runwayDuration.days >= 1) {
    formattedRunwayDuration = formatDurationUnit(runwayDuration.days, "day");
  } else {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="rounded-lg bg-muted p-2">
        <PiggyBank />
      </div>
      <div>
        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">Financial runway</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircleIcon className="size-4 opacity-50" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Based on your average monthly expenses over the last 6 months.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p>
          At your current spending rate, your assets could sustain you for{" "}
          {formattedRunwayDuration}.
        </p>
      </div>
    </div>
  );
}
