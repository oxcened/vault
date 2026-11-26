"use client";
import { useEffect, useState } from "react";
import { AmountInput } from "~/components/ui/amount-input";
import { Input } from "~/components/ui/input";
import { APP_CURRENCY } from "~/constants";
import { getCurrencyFractionDigits } from "~/utils/currency";

function useNumericDraft(value: number, onChange: (value: number) => void) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);
  return {
    draft,
    focus: () => setFocused(true),
    blur: () => setFocused(false),
    change: (next: string) => {
      setDraft(next);
      if (next.trim() && next !== "-" && Number.isFinite(Number(next)))
        onChange(Number(next));
    },
  };
}

type NumericProps = {
  id: string;
  label?: string;
  value: number;
  onChange: (value: number) => void;
};

export function NumericAmountInput({
  id,
  label,
  value,
  onChange,
}: NumericProps) {
  const draft = useNumericDraft(value, onChange);
  return (
    <AmountInput
      id={id}
      aria-label={label}
      currency={APP_CURRENCY}
      maxFractionDigits={getCurrencyFractionDigits(APP_CURRENCY)}
      value={draft.draft}
      onFocus={draft.focus}
      onBlur={draft.blur}
      onValueChange={draft.change}
    />
  );
}

export function NumericInput({ id, label, value, onChange }: NumericProps) {
  const draft = useNumericDraft(value, onChange);
  return (
    <Input
      id={id}
      aria-label={label}
      type="number"
      step="any"
      value={draft.draft}
      onFocus={draft.focus}
      onBlur={draft.blur}
      onChange={(event) => draft.change(event.target.value)}
    />
  );
}
