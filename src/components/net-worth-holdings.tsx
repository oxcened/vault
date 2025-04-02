"use client";

import { Fragment, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  CalendarIcon,
  EyeIcon,
  ListFilterIcon,
  MoreHorizontal,
  Plus,
  Trash2Icon,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { type Prisma } from "@prisma/client";
import { TableSkeleton } from "~/components/table-skeleton";
import { RoundedCurrency } from "~/components/ui/number";
import { DECIMAL_ZERO } from "~/utils/number";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "~/lib/utils";
import { MonthPicker } from "./ui/month-picker";
import { format, lastDayOfMonth, subMonths } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export type Holding = {
  quantityId: string;
  createdById: string;
  timestamp: Date;
  quantity: Prisma.Decimal;
  fxRate: string | null;
  exchangeRateId: string | null;
  valueInTarget: Prisma.Decimal;
  categoryId: string | null;
  categoryName: string | null;
  id: string;
  name: string;
  currency: string;
  stockPrice?: Prisma.Decimal | null;
  stockPriceId?: string | null;
  stockTicker?: string | null;
  tickerId?: string | null;
};

export type NetWorthHoldingsProps<T> = {
  holdings: T[];
  isFetching: boolean;
  holdingLabel: string;
  holdingLabelPlural: string;
  date: Date;
  onDateChange?: (date: Date) => void;
  onNewHolding: () => void;
  onEditHolding: (holding: T) => void;
  onDeleteHolding: (holding: T) => void;
};

export default function NetWorthHoldings<T extends Holding>({
  holdings,
  isFetching,
  holdingLabel,
  holdingLabelPlural,
  date,
  onDateChange,
  onNewHolding,
  onEditHolding,
  onDeleteHolding,
}: NetWorthHoldingsProps<T>) {
  const [hideStaleHoldings, setHideStaleHoldings] = useState(true);

  const nowMinusSixMonths = subMonths(new Date(), 6);

  const filteredHoldings = holdings.filter((holding) => {
    const isZero = holding.valueInTarget.equals(DECIMAL_ZERO);
    const isOld = holding.timestamp < nowMinusSixMonths;
    const isStale = isZero && isOld;
    if (hideStaleHoldings && isStale) return false;
    return true;
  });

  const categories = [
    ...new Set(filteredHoldings.map((item) => item.categoryName)),
  ];

  const dataByCategory = categories.map((category) => {
    const results = filteredHoldings.filter(
      (item) => item.categoryName === category,
    );
    return {
      category,
      results,
      total: results.reduce(
        (prev, curr) =>
          curr.valueInTarget ? prev.plus(curr.valueInTarget) : prev,
        DECIMAL_ZERO,
      ),
    };
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

        <Button
          variant="outline"
          className="ml-auto"
          size="icon"
          onClick={() => onNewHolding()}
        >
          <Plus />
        </Button>
      </header>

      <div className="mx-auto w-full max-w-screen-md p-5">
        {isFetching && <TableSkeleton />}

        {!isFetching && (
          <div className="flex gap-2">
            <div className="mr-auto">
              <p className="text-muted-foreground">
                Total {holdingLabelPlural.toLocaleLowerCase()}
              </p>
              <p className="text-3xl">
                <RoundedCurrency value={total} />
              </p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "pl-3 text-left font-normal",
                    !date && "text-muted-foreground",
                  )}
                >
                  {date ? format(date, "MMMM yyyy") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <MonthPicker
                  value={date}
                  disabled={(date) => date > new Date()}
                  onChange={(date) => onDateChange?.(lastDayOfMonth(date))}
                />
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <span className="sr-only">Open menu</span>
                  <ListFilterIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  Filter {holdingLabelPlural.toLocaleLowerCase()}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuCheckboxItem
                        checked={hideStaleHoldings}
                        onCheckedChange={setHideStaleHoldings}
                      >
                        Hide stale {holdingLabelPlural.toLocaleLowerCase()}
                      </DropdownMenuCheckboxItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>
                        {holdingLabelPlural} with 0 as value and no updates in
                        6+ months
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {!filteredHoldings.length && !isFetching && (
          <div className="mt-10 rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don&apos;t have any {holdingLabelPlural.toLocaleLowerCase()} yet
          </div>
        )}

        {dataByCategory.map(({ category, results, total }) => (
          <Fragment key={category}>
            <p className="mt-10 text-sm font-medium first:mt-0">{category}</p>

            <Table className="mt-5">
              <TableHeader>
                <TableRow>
                  <TableHead>{holdingLabel}</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="w-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>{row.name}</div>
                      {row.stockTicker && (
                        <div className="text-xs text-neutral-500">
                          {row.stockTicker} &middot; Qty {Number(row.quantity)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <RoundedCurrency value={row.valueInTarget} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEditHolding(row)}>
                            <EyeIcon />
                            Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteHolding(row)}
                          >
                            <Trash2Icon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">
                    <RoundedCurrency value={total} />
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Fragment>
        ))}
      </div>
    </>
  );
}
