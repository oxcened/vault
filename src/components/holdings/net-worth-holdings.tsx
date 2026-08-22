"use client";

import { useState } from "react";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Archive, ArrowLeft, CreditCard, PiggyBank, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TableSkeleton } from "~/components/table-skeleton";
import { RoundedCurrency } from "~/components/ui/number";
import { DECIMAL_ZERO } from "~/utils/number";
import { api } from "~/trpc/react";
import type Decimal from "decimal.js";
import { CategoryTable } from "./category-table";
import { cn } from "~/lib/utils";
import { MonthPicker } from "~/components/ui/month-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { HoldingMobileList } from "./holding-mobile-list";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  date?: Date;
  onDateChange?: (date: Date) => void;
  onNewHolding?: () => void;
  onEditHolding: (holding: T) => void;
  onDeleteHolding: (holding: T) => void;
  onArchiveHolding: (holding: T) => void;
  getHoldingDetailUrl: (holding: T) => string;
  archivedOnly?: boolean;
};

export default function NetWorthHoldings<T extends Holding>({
  holdings,
  isFetching,
  holdingLabel,
  holdingLabelPlural,
  type,
  date,
  onDateChange,
  onNewHolding,
  onEditHolding,
  onDeleteHolding,
  onArchiveHolding,
  getHoldingDetailUrl,
  archivedOnly = false,
}: NetWorthHoldingsProps<T>) {
  const [holdingToArchive, setHoldingToArchive] = useState<T>();
  const router = useRouter();
  const activeHoldings = holdings.filter((holding) => !holding.archivedAt);
  const archivedHoldings = holdings
    .filter((holding) => holding.archivedAt)
    .sort(
      (a, b) => (b.archivedAt?.getTime() ?? 0) - (a.archivedAt?.getTime() ?? 0),
    );

  const { data: categories = [], isPending: isLoadingCategories } =
    api.netWorthCategory.getByType.useQuery({
      type: [type === "asset" ? "ASSET" : "DEBT", "BOTH"],
    });

  const total = activeHoldings.reduce(
    (prev, curr) => (curr.valueInTarget ? prev.plus(curr.valueInTarget) : prev),
    DECIMAL_ZERO,
  );
  const visibleCategoryCount = new Set(
    activeHoldings.map((holding) => holding.categoryId).filter(Boolean),
  ).size;
  const HoldingTypeIcon = type === "asset" ? PiggyBank : CreditCard;
  const holdingToArchiveHasBalance =
    !!holdingToArchive?.quantity && !holdingToArchive.quantity.eq(0);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DashboardBreadcrumb
          items={
            archivedOnly
              ? [
                  {
                    label: holdingLabelPlural,
                    href: `/dashboard/${type === "asset" ? "assets" : "debts"}`,
                  },
                  { label: "Archived" },
                ]
              : [{ label: holdingLabelPlural }]
          }
        />
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
                      {archivedOnly
                        ? `Archived ${holdingLabelPlural.toLocaleLowerCase()}`
                        : holdingLabelPlural}
                    </h1>
                    <p className="truncate text-sm text-muted-foreground">
                      {archivedOnly ? (
                        <>
                          {archivedHoldings.length} archived{" "}
                          {archivedHoldings.length === 1
                            ? holdingLabel.toLocaleLowerCase()
                            : holdingLabelPlural.toLocaleLowerCase()}
                        </>
                      ) : (
                        <>
                          {activeHoldings.length}{" "}
                          {activeHoldings.length === 1
                            ? holdingLabel.toLocaleLowerCase()
                            : holdingLabelPlural.toLocaleLowerCase()}
                          {visibleCategoryCount > 0 &&
                            ` across ${visibleCategoryCount} ${
                              visibleCategoryCount === 1
                                ? "category"
                                : "categories"
                            }`}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {!archivedOnly && (
                  <div className="sm:border-l sm:pl-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Total value
                    </p>
                    <p className="text-2xl font-semibold tabular-nums">
                      <RoundedCurrency value={total} />
                    </p>
                  </div>
                )}

                <div className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto">
                  {!archivedOnly && date && onDateChange && (
                    <MonthPicker
                      value={date}
                      maxMonth={new Date()}
                      className="col-span-2 w-full sm:w-auto"
                      onChange={onDateChange}
                    />
                  )}
                  {archivedOnly ? (
                    <Button asChild variant="outline">
                      <Link
                        href={`/dashboard/${type === "asset" ? "assets" : "debts"}`}
                      >
                        <ArrowLeft /> Back to active
                      </Link>
                    </Button>
                  ) : onNewHolding ? (
                    <Button
                      variant="default"
                      className="col-span-2 w-full sm:col-span-1 sm:w-auto"
                      onClick={onNewHolding}
                    >
                      <Plus />
                      Add
                    </Button>
                  ) : null}
                </div>
              </div>
            </section>

            {!archivedOnly &&
              categories
                .map((category) => {
                  const holdingsForCat = activeHoldings.filter(
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
                      onArchiveHolding={setHoldingToArchive}
                      onDeleteHolding={onDeleteHolding}
                      onEditHolding={onEditHolding}
                      getHoldingDetailUrl={getHoldingDetailUrl}
                      type={type}
                    />
                  );
                })}

            {!archivedOnly && activeHoldings.length === 0 && (
              <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                No active {holdingLabelPlural.toLocaleLowerCase()}.
              </div>
            )}

            {!archivedOnly && archivedHoldings.length > 0 && (
              <div className="flex justify-center border-t pt-4">
                <Button asChild variant="ghost" size="sm">
                  <Link
                    href={`/dashboard/${type === "asset" ? "assets" : "debts"}/archived`}
                    className="text-muted-foreground"
                  >
                    <Archive /> Archived ({archivedHoldings.length})
                  </Link>
                </Button>
              </div>
            )}

            {archivedOnly && (
              <section>
                <div className="mb-3 px-1">
                  <h2 className="font-semibold">Archived holdings</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Removed from active totals. Restore a holding to make it
                    active again.
                  </p>
                </div>
                {archivedHoldings.length > 0 ? (
                  <HoldingMobileList
                    holdings={archivedHoldings}
                    type={type}
                    archivedView
                    onHoldingClick={(holding) =>
                      router.push(getHoldingDetailUrl(holding))
                    }
                    onEditHolding={onEditHolding}
                    onDeleteHolding={onDeleteHolding}
                    onArchiveHolding={onArchiveHolding}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                    No archived {holdingLabelPlural.toLocaleLowerCase()}.
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <AlertDialog
        open={!!holdingToArchive}
        onOpenChange={(open) => !open && setHoldingToArchive(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {holdingToArchiveHasBalance
                ? `Change ${holdingToArchive?.name} to zero and archive?`
                : `Archive ${holdingToArchive?.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {holdingToArchiveHasBalance && (
                <>A zero valuation will be recorded for the current month. </>
              )}
              This {holdingLabel.toLocaleLowerCase()} will be removed from your
              active portfolio and totals. You can restore it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (holdingToArchive) onArchiveHolding(holdingToArchive);
                setHoldingToArchive(undefined);
              }}
            >
              {holdingToArchiveHasBalance
                ? "Change to zero and archive"
                : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
