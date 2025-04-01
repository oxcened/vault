import * as React from "react";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface MonthPickerProps {
  value: Date;
  onChange?: (date: Date) => void;
  className?: string;
  disabled?: (date: Date) => boolean;
}

export function MonthPicker({
  value,
  onChange,
  className,
  disabled,
}: MonthPickerProps) {
  const [year, setYear] = React.useState(value.getFullYear());

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(year, monthIndex, 1);
    onChange?.(newDate);
  };

  const prevYear = () => setYear((prev) => prev - 1);
  const nextYear = () => setYear((prev) => prev + 1);

  return (
    <div className={cn("w-64 p-4", className)}>
      <div className="mb-4 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          className="size-7 p-0"
          onClick={prevYear}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">{year}</span>
        <Button
          type="button"
          variant="outline"
          className="size-7 p-0"
          onClick={nextYear}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((month, index) => {
          const dateForMonth = new Date(year, index, 1);
          const isSelected =
            value.getFullYear() === year && value.getMonth() === index;
          const isDisabled = disabled?.(dateForMonth);
          return (
            <Button
              key={month}
              variant={isSelected ? "default" : "ghost"}
              onClick={() => handleMonthSelect(index)}
              className="font-normal"
              disabled={isDisabled}
            >
              {month.substring(0, 3)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
