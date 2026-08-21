"use client";

import { type Prisma } from "@prisma/client";
import { format } from "date-fns";
import { APP_CURRENCY } from "~/constants";
import { cn } from "~/lib/utils";

type FinancialSparklineProps = {
  data?: Array<{
    timestamp: Date;
    value: Prisma.Decimal;
  }>;
  label: "cash-flow" | "net-worth";
};

const WIDTH = 88;
const HEIGHT = 32;
const PADDING = 3;

export function FinancialSparkline({ data, label }: FinancialSparklineProps) {
  if (!data || data.length < 2) return null;

  const values = data.map(({ value }) => value.toNumber());
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const usableWidth = WIDTH - PADDING * 2;
  const usableHeight = HEIGHT - PADDING * 2;

  const points = values.map((value, index) => ({
    x: PADDING + (index / (values.length - 1)) * usableWidth,
    y:
      range === 0
        ? HEIGHT / 2
        : PADDING + ((max - value) / range) * usableHeight,
  }));

  const isUp = values.at(-1)! >= values[0]!;
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const latest = points.at(-1)!;
  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: APP_CURRENCY,
    maximumFractionDigits: 0,
  });

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Recent ${label} trend`}
      className={cn(
        "h-8 w-[5.5rem] overflow-visible",
        isUp ? "text-financial-positive" : "text-financial-negative",
      )}
    >
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {points.map(({ x, y }, index) => (
        <circle
          key={data[index]!.timestamp.toISOString()}
          cx={x}
          cy={y}
          r="6"
          fill="transparent"
        >
          <title>
            {format(data[index]!.timestamp, "MMM yyyy")}:{" "}
            {currencyFormatter.format(values[index]!)}
          </title>
        </circle>
      ))}
      <circle cx={latest.x} cy={latest.y} r="2.5" fill="currentColor" />
    </svg>
  );
}
