import { Prisma } from "@prisma/client";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "~/lib/utils";
import { Percentage } from "./number";

export type TrendIndicatorProps = {
  value?: Prisma.Decimal;
};

export function TrendIndicator({ value }: TrendIndicatorProps) {
  if (!value || value.eq(0)) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 self-center rounded-lg text-sm",
        value.gt(0) ? "text-financial-positive" : "text-financial-negative",
      )}
    >
      {value.gt(0) ? (
        <TrendingUp className="size-4" />
      ) : (
        <TrendingDown className="size-4" />
      )}
      <p>
        <Percentage value={value} /> this month
      </p>
    </div>
  );
}
