import { type Prisma } from "@prisma/client";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "~/lib/utils";
import { Percentage } from "./number";
import { Badge } from "./badge";

export type TrendIndicatorProps = {
  value?: Prisma.Decimal;
  label?: string;
};

export function TrendIndicator({
  value,
  label = "this month",
}: TrendIndicatorProps) {
  if (!value || value.eq(0)) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 self-center",
        value.gt(0) ? "text-financial-positive" : "text-financial-negative",
      )}
    >
      {value.gt(0) ? (
        <TrendingUp className="size-4" />
      ) : (
        <TrendingDown className="size-4" />
      )}
      <p>
        <Percentage
          value={value}
          options={{
            signDisplay: "always",
          }}
        />{" "}
        {label}
      </p>
    </Badge>
  );
}
