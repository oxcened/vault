"use client";

import * as React from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

type MonthPickerProps = {
  value?: Date;
  onChange: (month: Date) => void;
  minMonth?: Date;
  maxMonth?: Date;
  disabled?: boolean;
  className?: string;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const shortMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

function monthKey(date: Date) {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

function utcMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1));
}

export function MonthPicker({
  value,
  onChange,
  minMonth,
  maxMonth,
  disabled,
  className,
}: MonthPickerProps) {
  const initialYear = value?.getUTCFullYear() ?? new Date().getUTCFullYear();
  const [open, setOpen] = React.useState(false);
  const [displayYear, setDisplayYear] = React.useState(initialYear);
  const [showYears, setShowYears] = React.useState(false);

  React.useEffect(() => {
    if (open) setDisplayYear(value?.getUTCFullYear() ?? initialYear);
  }, [open, value, initialYear]);

  const firstYear = displayYear - 5;
  const years = Array.from({ length: 12 }, (_, index) => firstYear + index);
  const currentMonth = utcMonth(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
  );

  const isDisabled = (month: Date) =>
    (minMonth !== undefined && monthKey(month) < monthKey(minMonth)) ||
    (maxMonth !== undefined && monthKey(month) > monthKey(maxMonth));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4 opacity-60" />
          {value ? monthFormatter.format(value) : "Select a month"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start">
        <div className="relative flex h-8 items-center justify-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute left-0 size-7 bg-transparent opacity-70"
            onClick={() =>
              showYears
                ? setDisplayYear((year) => year - 12)
                : setDisplayYear((year) => year - 1)
            }
            disabled={
              minMonth !== undefined &&
              (showYears
                ? firstYear <= minMonth.getUTCFullYear()
                : displayYear <= minMonth.getUTCFullYear())
            }
            aria-label={showYears ? "Previous years" : "Previous year"}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-3 font-medium"
            onClick={() => setShowYears((visible) => !visible)}
          >
            {showYears ? `${firstYear} – ${firstYear + 11}` : displayYear}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-0 size-7 bg-transparent opacity-70"
            onClick={() =>
              showYears
                ? setDisplayYear((year) => year + 12)
                : setDisplayYear((year) => year + 1)
            }
            disabled={
              maxMonth !== undefined &&
              (showYears
                ? firstYear + 11 >= maxMonth.getUTCFullYear()
                : displayYear >= maxMonth.getUTCFullYear())
            }
            aria-label={showYears ? "Next years" : "Next year"}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {showYears ? (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {years.map((year) => {
              const unavailable =
                (minMonth !== undefined && year < minMonth.getUTCFullYear()) ||
                (maxMonth !== undefined && year > maxMonth.getUTCFullYear());

              return (
                <Button
                  key={year}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-1 font-normal",
                    year === currentMonth.getUTCFullYear() &&
                      "bg-accent font-medium",
                  )}
                  disabled={unavailable}
                  onClick={() => {
                    setDisplayYear(year);
                    setShowYears(false);
                  }}
                >
                  {year}
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, monthIndex) => {
              const month = utcMonth(displayYear, monthIndex);
              const selected = value && monthKey(month) === monthKey(value);
              const current = monthKey(month) === monthKey(currentMonth);

              return (
                <Button
                  key={monthIndex}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 font-normal",
                    current && "bg-accent text-accent-foreground",
                    selected &&
                      "bg-primary font-medium text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                  disabled={isDisabled(month)}
                  onClick={() => {
                    onChange(month);
                    setOpen(false);
                  }}
                >
                  {shortMonthFormatter.format(month)}
                </Button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
