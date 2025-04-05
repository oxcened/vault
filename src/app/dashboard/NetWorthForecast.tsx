"use client";

import { api } from "~/trpc/react";
import { ChartNoAxesCombined, HelpCircleIcon } from "lucide-react";
import { DECIMAL_ZERO } from "~/utils/number";
import { RoundedCurrency } from "~/components/ui/number";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export default function NetWorthForecast() {
  const { data } = api.dashboard.getSummary.useQuery();

  const netWorthForecast =
    data?.netWorth?.netValue.plus(
      (data.cashFlowAvgLast6Months.netFlow ?? DECIMAL_ZERO).mul(12),
    ) ?? DECIMAL_ZERO;

  const isIncrease = netWorthForecast?.gt(
    data?.netWorth?.netValue ?? DECIMAL_ZERO,
  );

  if (netWorthForecast.eq(data?.netWorth?.netValue ?? DECIMAL_ZERO))
    return null;

  return (
    <div className="flex items-center gap-4">
      <div className="rounded-lg bg-muted p-2">
        <ChartNoAxesCombined />
      </div>
      <div>
        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">Net worth forecast</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircleIcon className="size-4 opacity-50" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Based on your average monthly cash flow over the last 6
                  months.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p>
          At your current cash flow trend, your net worth could{" "}
          {isIncrease ? "grow" : "shrink"} to{" "}
          <RoundedCurrency value={netWorthForecast} /> in a year.
        </p>
      </div>
    </div>
  );
}
