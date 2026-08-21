const CURRENCY_FRACTION_DIGIT_OVERRIDES: Record<string, number> = {
  BTC: 8,
  ETH: 18,
};

export function getCurrencyFractionDigits(currency: string): number {
  const normalizedCurrency = currency.trim().toUpperCase();
  const override = CURRENCY_FRACTION_DIGIT_OVERRIDES[normalizedCurrency];
  if (override !== undefined) return override;

  try {
    return (
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: normalizedCurrency,
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

export function getDecimalPlaces(value: number): number {
  if (!Number.isFinite(value) || Number.isInteger(value)) return 0;

  const [coefficient, exponentPart] = value.toString().toLowerCase().split("e");
  const fractionLength = coefficient?.split(".")[1]?.length ?? 0;
  const exponent = Number(exponentPart ?? 0);

  return Math.max(0, fractionLength - exponent);
}
