import {
  ArchiveIcon,
  Droplets,
  HelpCircleIcon,
  MoreHorizontalIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { RoundedCurrency, RoundedNumber } from "~/components/ui/number";
import { formatDate } from "~/utils/date";
import type { Holding } from "./net-worth-holdings";
import { HoldingIcon } from "./holding-icon";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type HoldingListProps<T extends Holding> = {
  holdings: T[];
  type: "asset" | "debt";
  isStock?: boolean;
  onHoldingClick: (holding: T) => void;
  onEditHolding: (holding: T) => void;
  onDeleteHolding: (holding: T) => void;
  onArchiveHolding: (holding: T) => void;
};

export function HoldingMobileList<T extends Holding>({
  holdings,
  type,
  isStock,
  onHoldingClick,
  onEditHolding,
  onDeleteHolding,
  onArchiveHolding,
}: HoldingListProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {holdings.map((holding) => {
        const isArchiveDisabled = !!holding.quantity && !holding.quantity.eq(0);

        return (
          <div
            key={holding.id}
            className="group flex items-center gap-3 border-b px-3 py-3 transition-colors last:border-b-0 hover:bg-muted/40 md:px-4"
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              onClick={() => onHoldingClick(holding)}
              aria-label={`View ${holding.name}`}
            >
              <HoldingIcon
                category={holding.categoryName ?? "Other"}
                type={type}
              />
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
                  {type === "asset" && holding.isLiquid && (
                    <span className="flex shrink-0 items-center gap-1">
                      <Droplets className="size-3" /> Liquid
                    </span>
                  )}
                  {isStock && holding.quantity && (
                    <>
                      {type === "asset" && holding.isLiquid && (
                        <span aria-hidden="true">·</span>
                      )}
                      <span className="hidden truncate sm:inline">
                        <RoundedNumber value={holding.quantity} /> ×{" "}
                        {holding.stockPrice ? (
                          <RoundedCurrency
                            value={holding.stockPrice}
                            options={{ currency: holding.currency }}
                          />
                        ) : (
                          "no price"
                        )}
                      </span>
                      <span className="truncate sm:hidden">
                        <RoundedNumber value={holding.quantity} /> units
                      </span>
                    </>
                  )}
                  {!isStock && !(type === "asset" && holding.isLiquid) && (
                    <span>
                      Updated{" "}
                      {formatDate({
                        date: holding.timestamp,
                        options: { month: "short", day: "numeric" },
                      })}
                    </span>
                  )}
                </span>
              </span>
            </button>

            <button
              type="button"
              className="shrink-0 text-right"
              onClick={() => onHoldingClick(holding)}
            >
              <RoundedCurrency
                value={holding.valueInTarget}
                className="block text-sm"
              />
              <span className="mt-0.5 hidden text-xs text-muted-foreground md:block">
                Updated{" "}
                {formatDate({
                  date: holding.timestamp,
                  options: { month: "short", day: "numeric" },
                })}
              </span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 shrink-0">
                  <MoreHorizontalIcon />
                  <span className="sr-only">Holding actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditHolding(holding)}>
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="flex items-center gap-1">
                  <DropdownMenuItem
                    className="flex-1"
                    disabled={isArchiveDisabled}
                    onClick={() => onArchiveHolding(holding)}
                  >
                    {holding.archivedAt ? "Unarchive" : "Archive"}
                  </DropdownMenuItem>
                  {isArchiveDisabled && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircleIcon className="mr-2 size-4 opacity-50" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Quantity must be 0 to archive.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDeleteHolding(holding)}
                >
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}
