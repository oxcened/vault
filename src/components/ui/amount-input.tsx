import * as React from "react";

import { cn } from "~/lib/utils";

export type AmountInputProps = Omit<
  React.ComponentProps<"input">,
  "inputMode" | "onChange" | "type" | "value"
> & {
  currency?: string;
  currencyAction?: React.ReactNode;
  maxFractionDigits: number;
  value?: number | string | null;
  onValueChange: (value: string) => void;
};

const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  (
    {
      className,
      currency,
      currencyAction,
      maxFractionDigits,
      onFocus,
      onBlur,
      onValueChange,
      value,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = React.useState(false);
    const rawValue = String(value ?? "");
    const completeNumber = /^-?\d+(?:\.\d*)?$/.test(rawValue);
    const [integer, fraction = ""] = rawValue.split(".");
    const minimumDigits = Math.min(2, maxFractionDigits);
    const groupedInteger = integer?.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const displayValue =
      !focused && completeNumber
        ? minimumDigits > 0 || fraction.length > 0
          ? `${groupedInteger}.${fraction.padEnd(minimumDigits, "0")}`
          : (groupedInteger ?? rawValue)
        : rawValue;

    return (
      <div
        className={cn(
          "flex h-9 w-full items-center rounded-md border border-input bg-transparent shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring",
          props.disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-base tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
          value={displayValue}
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            const fraction = nextValue.split(/[.,]/)[1];

            if (
              /^-?\d*(?:[.,]\d*)?$/.test(nextValue) &&
              (fraction?.length ?? 0) <= maxFractionDigits
            ) {
              onValueChange(
                nextValue.replace(",", ".").replace(/^(-?)0+(?=\d)/, "$1"),
              );
            }
          }}
          onFocus={(event) => {
            setFocused(true);
            if (event.currentTarget.value) event.currentTarget.select();
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {currencyAction ? (
          <div className="mr-1 flex items-center border-l border-border pl-1">
            {currencyAction}
          </div>
        ) : currency ? (
          <span className="mr-3 border-l border-border pl-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {currency}
          </span>
        ) : null}
      </div>
    );
  },
);

AmountInput.displayName = "AmountInput";

export { AmountInput };
