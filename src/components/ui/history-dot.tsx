import { cn } from "~/lib/utils";

const accentClasses = {
  blue: "bg-blue-500 ring-blue-500/10",
  emerald: "bg-emerald-500 ring-emerald-500/10",
} as const;

export function HistoryDot({
  latest,
  accent,
  className,
}: {
  latest: boolean;
  accent: keyof typeof accentClasses;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-2 shrink-0 rounded-full",
        latest ? cn("ring-4", accentClasses[accent]) : "bg-border",
        className,
      )}
    />
  );
}
