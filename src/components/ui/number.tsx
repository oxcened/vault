import { type Prisma } from "@prisma/client";
import { APP_CURRENCY } from "~/constants";
import { cn } from "~/lib/utils";
import { formatNumber } from "~/utils/number";
import { usePrivacy } from "../privacy";

export type NumberProps = {
  value?: Prisma.Decimal | number | null;
  options?: Intl.NumberFormatOptions;
  className?: string;
  sensitive?: boolean;
};

export function Number({
  value,
  options,
  className,
  sensitive = false,
}: NumberProps) {
  const { mode } = usePrivacy();

  return (
    <span
      className={cn(
        sensitive && mode !== "off" && "blur-md",
        sensitive && mode === "hoverToReveal" && "hover:blur-none",
        "tabular-nums",
        className,
      )}
    >
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

export function Currency({ options, sensitive = true, ...props }: NumberProps) {
  return (
    <Number
      {...props}
      sensitive={sensitive}
      options={{
        ...defaultCurrencyOptions,
        ...options,
      }}
    />
  );
}

export function RoundedCurrency({ options, ...props }: NumberProps) {
  return (
    <Currency
      {...props}
      options={{
        ...defaultCurrencyOptions,
        maximumFractionDigits: 0,
        ...options,
      }}
    />
  );
}

export function Percentage({ options, ...props }: NumberProps) {
  return (
    <Number
      {...props}
      options={{
        style: "percent",
        ...options,
      }}
    />
  );
}
