import { ArchiveIcon, Droplets } from "lucide-react";
import { RoundedCurrency } from "~/components/ui/number";
import { formatDate } from "~/utils/date";
import type { Holding } from "./net-worth-holdings";
import { HoldingIcon } from "./holding-icon";

type HoldingMobileListProps<T extends Holding> = {
  holdings: T[];
  type: "asset" | "debt";
  onHoldingClick: (holding: T) => void;
};

export function HoldingMobileList<T extends Holding>({
  holdings,
  type,
  onHoldingClick,
}: HoldingMobileListProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card md:hidden">
      {holdings.map((holding) => (
        <button
          key={holding.id}
          type="button"
          className="flex w-full items-center gap-3 border-b px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50 active:bg-muted"
          onClick={() => onHoldingClick(holding)}
          aria-label={`View ${holding.name}`}
        >
          <HoldingIcon category={holding.categoryName ?? "Other"} type={type} />

          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-medium">
                {holding.name}
              </span>
              {holding.archivedAt && (
                <ArchiveIcon className="size-3.5 shrink-0 text-muted-foreground" />
              )}
            </span>
            <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate">
                {holding.categoryName ?? "Other"}
              </span>
              {type === "asset" && holding.isLiquid && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="flex shrink-0 items-center gap-1">
                    <Droplets className="size-3" />
                    Liquid
                  </span>
                </>
              )}
            </span>
          </span>

          <span className="shrink-0 text-right">
            <RoundedCurrency
              value={holding.valueInTarget}
              className="block text-sm"
            />
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {formatDate({
                date: holding.timestamp,
                options: { month: "short", day: "numeric" },
              })}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
