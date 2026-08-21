import * as React from "react";

import { Input } from "~/components/ui/input";

export type DescriptionSuggestion = {
  description: string;
  categoryId: string;
  categoryName: string;
};

export type DescriptionAutocompleteProps = Omit<
  React.ComponentProps<typeof Input>,
  "onChange" | "value"
> & {
  suggestions: DescriptionSuggestion[];
  value: string;
  onValueChange: (value: string) => void;
  onSuggestionSelect: (suggestion: DescriptionSuggestion) => void;
};

const DescriptionAutocomplete = React.forwardRef<
  HTMLInputElement,
  DescriptionAutocompleteProps
>(
  (
    {
      onBlur,
      onFocus,
      onKeyDown,
      onSuggestionSelect,
      onValueChange,
      suggestions,
      value,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const listId = React.useId();
    const isOpen =
      isFocused && value.trim().length > 0 && suggestions.length > 0;

    React.useEffect(() => setActiveIndex(0), [suggestions]);

    const selectSuggestion = (suggestion: DescriptionSuggestion) => {
      onValueChange(suggestion.description);
      onSuggestionSelect(suggestion);
      setIsFocused(false);
    };

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          value={value}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listId : undefined}
          aria-activedescendant={
            isOpen ? `${listId}-option-${activeIndex}` : undefined
          }
          onChange={(event) => {
            setIsFocused(true);
            onValueChange(event.currentTarget.value);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onKeyDown={(event) => {
            const hasSuggestions =
              value.trim().length > 0 && suggestions.length > 0;

            if (!isOpen && hasSuggestions && event.key === "ArrowDown") {
              event.preventDefault();
              event.stopPropagation();
              setActiveIndex(0);
              setIsFocused(true);
            } else if (isOpen && event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => (index + 1) % suggestions.length);
            } else if (isOpen && event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex(
                (index) =>
                  (index - 1 + suggestions.length) % suggestions.length,
              );
            } else if (isOpen && event.key === "Enter") {
              event.preventDefault();
              const suggestion = suggestions[activeIndex];
              if (suggestion) selectSuggestion(suggestion);
            } else if (isOpen && event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setIsFocused(false);
            }
            onKeyDown?.(event);
          }}
        />

        {isOpen && (
          <div
            id={listId}
            role="listbox"
            className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {suggestions.map((suggestion, index) => (
              <button
                id={`${listId}-option-${index}`}
                key={`${suggestion.description}-${suggestion.categoryId}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className="flex w-full items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent aria-selected:bg-accent"
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                <span className="truncate">{suggestion.description}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {suggestion.categoryName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

DescriptionAutocomplete.displayName = "DescriptionAutocomplete";

export { DescriptionAutocomplete };
