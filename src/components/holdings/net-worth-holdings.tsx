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
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FilterIcon,
  Plus,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { NetWorthCategory } from "@prisma/client";
import { TableSkeleton } from "~/components/table-skeleton";
import { RoundedCurrency } from "~/components/ui/number";
import { DECIMAL_ZERO } from "~/utils/number";
import {
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { useTable } from "~/hooks/useTable";
import { holdingsColumns } from "./config";
import { DataTable } from "../ui/data-table";
import { DataTableColumns } from "../ui/data-table-columns";
import { api } from "~/trpc/react";
import Decimal from "decimal.js";

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

            {categories.map((category) => {
              const categoryHoldings = filteredHoldings.filter(
                (holding) => holding.categoryId === category.id,
              );

              if (!categoryHoldings.length) return null;

              return (
                <CategoryTable
                  key={category.id}
                  holdings={categoryHoldings}
                  category={category}
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

function CategoryTable<T extends Holding>({
  holdings,
  category,
  onEditHolding,
  onDeleteHolding,
  onArchiveHolding,
}: {
  holdings: T[];
  category: NetWorthCategory;
  onEditHolding: (holding: T) => void;
  onDeleteHolding: (holding: T) => void;
  onArchiveHolding: (holding: T) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "valueInTarget",
      desc: true,
    },
  ]);

  const table = useTable({
    data: holdings,
    columns: holdingsColumns({ isStock: category.isStock }),
    getCoreRowModel: getCoreRowModel(),
    meta: {
      id: "exchangeRates",
      onEditHolding,
      onDeleteHolding,
      onArchiveHolding,
    },
    initialState: {
      columnVisibility: {
        archivedAt: false,
        fxRate: false,
        stockPrice: category.isStock,
        stockTicker: false,
        currency: false,
        quantity: category.isStock,
      },
    },
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
  });

  const [isOpen, setOpen] = useState(true);

  const total = holdings.reduce(
    (prev, curr) => (curr.valueInTarget ? prev.plus(curr.valueInTarget) : prev),
    DECIMAL_ZERO,
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((state) => !state)}
        >
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </Button>

        <div className="mr-auto">
          <p className="text-sm text-muted-foreground">{category.name}</p>
          <RoundedCurrency value={total} className="text-sm font-medium" />
        </div>
        <DataTableColumns table={table} />
      </div>

      {isOpen && (
        <>
          <DataTable table={table} />
        </>
      )}
    </div>
  );
}
