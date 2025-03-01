import { Prisma } from "@prisma/client";

export const defaultCurrencyOptions: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
};

export type FormatCurrencyParams = {
  value: Prisma.Decimal | number;
  options?: Intl.NumberFormatOptions;
};

export function formatCurrency({
  value,
  options,
}: FormatCurrencyParams): string {
  return new Intl.NumberFormat(navigator.language || "en-US", {
    ...defaultCurrencyOptions,
    ...options,
  }).format(Number(value));
}
