"use client";

import { api } from "~/trpc/react";
import { HelpCircleIcon } from "lucide-react";
import { DECIMAL_ZERO } from "~/utils/number";
import { RoundedCurrency } from "~/components/ui/number";
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
import { DateTime } from "luxon";

export default function NetWorthForecast() {
  const { data } = api.dashboard.getSummary.useQuery();

  const netWorthForecast =
    data?.netWorth?.netValue.plus(
      (data.cashFlowAvgLast6Months.netFlow ?? DECIMAL_ZERO).mul(12),
    ) ?? DECIMAL_ZERO;

  if (netWorthForecast.eq(data?.netWorth?.netValue ?? DECIMAL_ZERO))
    return null;

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>
          Net worth forecast ({DateTime.now().plus({ year: 1 }).year})
        </CardDescription>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircleIcon className="size-4 opacity-50" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Based on your average monthly cash flow over the last 6 months.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-3xl">
          <RoundedCurrency value={netWorthForecast} />
        </CardTitle>
      </CardContent>
    </Card>
  );
}
