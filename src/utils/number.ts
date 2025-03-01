import { Prisma } from "@prisma/client";

export const defaultNumberOptions: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
};

export type FormatNumberOptions = {
  value: Prisma.Decimal | number;
  options?: Intl.NumberFormatOptions;
};

export function formatNumber({ value, options }: FormatNumberOptions): string {
  return new Intl.NumberFormat(navigator.language || "en-US", {
    ...defaultNumberOptions,
    ...options,
  }).format(Number(value));
}
