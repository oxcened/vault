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
import { FilterIcon, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TableSkeleton } from "~/components/table-skeleton";
import { RoundedCurrency } from "~/components/ui/number";
import { DECIMAL_ZERO } from "~/utils/number";
import { api } from "~/trpc/react";
import Decimal from "decimal.js";
import { CategoryTable } from "./category-table";

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

      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-5">
        {isFetching || isLoadingCategories ? (
          <TableSkeleton />
        ) : (
          <>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="mr-auto">
                <p className="text-sm text-muted-foreground">
                  Total {holdingLabelPlural.toLocaleLowerCase()}
                </p>
                <p className="text-3xl font-semibold">
                  <RoundedCurrency value={total} />
                </p>
              </div>

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

              <Button
                variant="default"
                title="Collapse holdings table"
                onClick={() => onNewHolding()}
              >
                <Plus />
                Add
              </Button>
            </div>

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
                  />
                );
              })}
          </>
        )}
      </div>
    </>
  );
}
