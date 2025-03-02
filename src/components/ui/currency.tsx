import { Prisma } from "@prisma/client";
import { cn } from "~/lib/utils";
import { formatCurrency } from "~/utils/currency";

export type CurrencyProps = {
  value?: Prisma.Decimal | number | null;
  options?: Intl.NumberFormatOptions;
  className?: string;
};

export function Currency({ value, options, className }: CurrencyProps) {
  return (
    <span className={cn("font-mono", className)}>
      {formatCurrency({ value: value ?? 0, options })}
    </span>
  );
}
