import type { NetWorthCategory } from "@prisma/client";
import type Decimal from "decimal.js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import type { Holding } from "./net-worth-holdings";
import { RoundedCurrency } from "../ui/number";
import { HoldingMobileList } from "./holding-mobile-list";

export function CategoryTable<T extends Holding>({
  holdings,
  category,
  total,
  onEditHolding,
  onDeleteHolding,
  onArchiveHolding,
  getHoldingDetailUrl,
  type,
}: {
  holdings: T[];
  category: NetWorthCategory;
  total: Decimal;
  onEditHolding: (holding: T) => void;
  onDeleteHolding: (holding: T) => void;
  onArchiveHolding: (holding: T) => void;
  getHoldingDetailUrl: (holding: T) => string;
  type: "asset" | "debt";
}) {
  const router = useRouter();
  const [isOpen, setOpen] = useState(true);
  const sortedHoldings = [...holdings].sort((a, b) =>
    b.valueInTarget.comparedTo(a.valueInTarget),
  );

  return (
    <section className="space-y-2">
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/40"
        onClick={() => setOpen((state) => !state)}
        aria-expanded={isOpen}
      >
        <span className="flex size-6 items-center justify-center text-muted-foreground">
          {isOpen ? (
            <ChevronDownIcon className="size-4" />
          ) : (
            <ChevronRightIcon className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {category.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {holdings.length} {holdings.length === 1 ? "holding" : "holdings"}
          </span>
        </span>
        <RoundedCurrency value={total} className="text-sm font-medium" />
      </button>

      {isOpen && (
        <HoldingMobileList
          holdings={sortedHoldings}
          type={type}
          isStock={category.isStock}
          onHoldingClick={(holding) =>
            router.push(getHoldingDetailUrl(holding))
          }
          onEditHolding={onEditHolding}
          onDeleteHolding={onDeleteHolding}
          onArchiveHolding={onArchiveHolding}
        />
      )}
    </section>
  );
}
