"use client";

import { api } from "~/trpc/react";
import { HelpCircleIcon } from "lucide-react";
import { Duration } from "luxon";
import { DECIMAL_ZERO } from "~/utils/number";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { usePrivacy } from "~/components/privacy";
import { cn } from "~/lib/utils";

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

  const { mode } = usePrivacy();

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>Financial runway</CardDescription>
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
      </CardHeader>
      <CardContent>
        <CardTitle
          className={cn(
            "text-3xl",
            mode !== "off" && "blur-md",
            mode === "hoverToReveal" && "hover:blur-none",
          )}
        >
          {formattedRunwayDuration}
        </CardTitle>
      </CardContent>
    </Card>
  );
}
