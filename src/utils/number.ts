import { Prisma } from "@prisma/client";

export type FormatNumberOptions = {
  value: Prisma.Decimal | number;
  options?: Intl.NumberFormatOptions;
};

export function formatNumber({ value, options }: FormatNumberOptions): string {
  return new Intl.NumberFormat(navigator.language || "en-US", options).format(
    Prisma.Decimal.isDecimal(value) ? value.toNumber() : value,
  );
}

export const DECIMAL_ZERO = new Prisma.Decimal(0);
