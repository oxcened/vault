import * as React from "react";

import { cn } from "~/lib/utils";

export type AmountInputProps = Omit<
  React.ComponentProps<"input">,
  "inputMode" | "onChange" | "type" | "value"
> & {
  currency: string;
  maxFractionDigits: number;
  value?: number | string | null;
  onValueChange: (value: string) => void;
};

const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  (
    {
      className,
      currency,
      maxFractionDigits,
      onFocus,
      onValueChange,
      value,
      ...props
    },
    ref,
  ) => {
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
          value={value ?? ""}
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            const fraction = nextValue.split(/[.,]/)[1];

            if (
              /^-?\d*(?:[.,]\d*)?$/.test(nextValue) &&
              (fraction?.length ?? 0) <= maxFractionDigits
            ) {
              onValueChange(nextValue.replace(",", "."));
            }
          }}
          onFocus={(event) => {
            if (event.currentTarget.value) event.currentTarget.select();
            onFocus?.(event);
          }}
          {...props}
        />
        <span className="mr-3 border-l border-border pl-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {currency}
        </span>
      </div>
    );
  },
);

AmountInput.displayName = "AmountInput";

export { AmountInput };
