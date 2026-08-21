"use client";

import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { CreditCard, FilterIcon, PiggyBank, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TableSkeleton } from "~/components/table-skeleton";
import { RoundedCurrency } from "~/components/ui/number";
import { DECIMAL_ZERO } from "~/utils/number";
import { api } from "~/trpc/react";
import type Decimal from "decimal.js";
import { CategoryTable } from "./category-table";
import { cn } from "~/lib/utils";

export type Holding = {
  quantityId: string;
  createdById: string;
  timestamp: Date;
  quantity: Decimal | null;
  fxRate: Decimal | null;
  exchangeRateId: string | null;
  valueInTarget: Decimal;
  categoryId: string | null;
  categoryName: string | null;
  id: string;
  name: string;
  currency: string;
  stockPrice?: Decimal | null;
  stockPriceId?: string | null;
  stockTicker?: string | null;
  tickerId?: string | null;
  archivedAt: Date | null;
  isLiquid?: boolean | null;
};

export type NetWorthHoldingsProps<T> = {
  holdings: T[];
  isFetching: boolean;
  holdingLabel: string;
  holdingLabelPlural: string;
  type: "asset" | "debt";
  onNewHolding: () => void;
  onEditHolding: (holding: T) => void;
  onDeleteHolding: (holding: T) => void;
  onArchiveHolding: (holding: T) => void;
  getHoldingDetailUrl: (holding: T) => string;
};

export default function NetWorthHoldings<T extends Holding>({
  holdings,
  isFetching,
  holdingLabel,
  holdingLabelPlural,
  type,
  onNewHolding,
  onEditHolding,
  onDeleteHolding,
  onArchiveHolding,
  getHoldingDetailUrl,
}: NetWorthHoldingsProps<T>) {
  const [hideArchivedHolding, setHideArchivedHoldings] = useState(true);

  const filteredHoldings = holdings.filter((holding) => {
    if (hideArchivedHolding && holding.archivedAt) {
      return false;
    }
    return true;
  });

  const { data: categories = [], isPending: isLoadingCategories } =
    api.netWorthCategory.getByType.useQuery({
      type: [type === "asset" ? "ASSET" : "DEBT", "BOTH"],
    });

  const total = filteredHoldings.reduce(
    (prev, curr) => (curr.valueInTarget ? prev.plus(curr.valueInTarget) : prev),
    DECIMAL_ZERO,
  );
  const visibleCategoryCount = new Set(
    filteredHoldings.map((holding) => holding.categoryId).filter(Boolean),
  ).size;
  const HoldingTypeIcon = type === "asset" ? PiggyBank : CreditCard;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard/net-worth">
                Net worth
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{holdingLabelPlural}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-screen-lg flex-col gap-5 p-5">
        {isFetching || isLoadingCategories ? (
          <TableSkeleton />
        ) : (
          <>
            <section
              className={cn(
                "rounded-xl border bg-gradient-to-br p-4 sm:p-5",
                type === "asset"
                  ? "from-blue-500/[0.08] via-card to-card"
                  : "from-rose-500/[0.08] via-card to-card",
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl border",
                      type === "asset"
                        ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-400",
                    )}
                  >
                    <HoldingTypeIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-semibold tracking-tight">
                      {holdingLabelPlural}
                    </h1>
                    <p className="truncate text-sm text-muted-foreground">
                      {filteredHoldings.length}{" "}
                      {filteredHoldings.length === 1
                        ? holdingLabel.toLocaleLowerCase()
                        : holdingLabelPlural.toLocaleLowerCase()}
                      {visibleCategoryCount > 0 &&
                        ` across ${visibleCategoryCount} ${
                          visibleCategoryCount === 1 ? "category" : "categories"
                        }`}
                    </p>
                  </div>
                </div>

                <div className="sm:ml-auto sm:border-r sm:pr-5 sm:text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total value
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">
                    <RoundedCurrency value={total} />
                  </p>
                </div>

                <div className="flex gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <FilterIcon />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        Filter {holdingLabelPlural.toLocaleLowerCase()}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={hideArchivedHolding}
                        onCheckedChange={setHideArchivedHoldings}
                      >
                        Hide archived
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="default" onClick={() => onNewHolding()}>
                    <Plus />
                    Add
                  </Button>
                </div>
              </div>
            </section>

            {categories
              .map((category) => {
                const holdingsForCat = filteredHoldings.filter(
                  (holding) => holding.categoryId === category.id,
                );
                const total = holdingsForCat.reduce(
                  (prev, curr) =>
                    curr.valueInTarget ? prev.plus(curr.valueInTarget) : prev,
                  DECIMAL_ZERO,
                );
                return { category, holdingsForCat, total };
              })
              .sort((a, b) => b.total.comparedTo(a.total))
              .map(({ category, holdingsForCat, total }) => {
                if (!holdingsForCat.length) return null;
                return (
                  <CategoryTable
                    key={category.id}
                    holdings={holdingsForCat}
                    category={category}
                    total={total}
                    onArchiveHolding={onArchiveHolding}
                    onDeleteHolding={onDeleteHolding}
                    onEditHolding={onEditHolding}
                    getHoldingDetailUrl={getHoldingDetailUrl}
                    type={type}
                  />
                );
              })}
          </>
        )}
      </div>
    </>
  );
}
