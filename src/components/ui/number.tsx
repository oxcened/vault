import { Prisma } from "@prisma/client";
import { APP_CURRENCY } from "~/constants";
import { cn } from "~/lib/utils";
import { formatNumber } from "~/utils/number";

export type NumberProps = {
  value?: Prisma.Decimal | number | null;
  options?: Intl.NumberFormatOptions;
  className?: string;
};

export function Number({ value, options, className }: NumberProps) {
  return (
    <span className={cn("font-mono", className)}>
      {formatNumber({ value: value ?? 0, options })}
    </span>
  );
}

export function RoundedNumber({ options, ...props }: NumberProps) {
  return (
    <Number
      {...props}
      options={{
        maximumFractionDigits: 0,
        ...options,
      }}
    />
  );
}

const defaultCurrencyOptions: Intl.NumberFormatOptions = {
  style: "currency",
  currency: APP_CURRENCY,
};

export function Currency({ options, ...props }: NumberProps) {
  return (
    <Number
      {...props}
      options={{
        ...defaultCurrencyOptions,
        ...options,
      }}
    />
  );
}

export function RoundedCurrency({ options, ...props }: NumberProps) {
  return (
    <Number
      {...props}
      options={{
        ...defaultCurrencyOptions,
        maximumFractionDigits: 0,
        ...options,
      }}
    />
  );
}
