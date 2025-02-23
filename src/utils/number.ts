import { Decimal } from "decimal.js";

export const defaultNumberOptions: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
};

export type FormatNumberOptions = {
  value: Decimal | number;
  options?: Intl.NumberFormatOptions;
};

export function formatNumber({ value, options }: FormatNumberOptions): string {
  return new Intl.NumberFormat(navigator.language || "en-US", {
    ...defaultNumberOptions,
    ...options,
  }).format(Number(value));
}
