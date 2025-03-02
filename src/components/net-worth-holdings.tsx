"use client";

import { Fragment } from "react";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Prisma } from "@prisma/client";
import { Skeleton } from "~/components/ui/skeleton";
import { TableSkeleton } from "~/components/table-skeleton";
import { RoundedCurrency } from "~/components/ui/number";

export type Holding = {
  id: string;
  name: string;
  category: string;
  convertedValue: Prisma.Decimal | null;
};

export type NetWorthHoldingsProps<T> = {
  holdings: T[];
  isFetching: boolean;
  holdingLabel: string;
  holdingLabelPlural: string;
  onNewHolding: () => void;
  onEditHolding: (holding: T) => void;
  onDeleteHolding: (holding: T) => void;
};

export default function NetWorthHoldings<T extends Holding>({
  holdings,
  isFetching,
  holdingLabel,
  holdingLabelPlural,
  onNewHolding,
  onEditHolding,
  onDeleteHolding,
}: NetWorthHoldingsProps<T>) {
  const categories = [...new Set(holdings.map((item) => item.category))];

  const dataByCategory = categories.map((category) => {
    const results = holdings.filter((item) => item.category === category);
    return {
      category,
      results,
      total: results.reduce(
        (prev, curr) =>
          curr.convertedValue ? prev.plus(curr.convertedValue) : prev,
        new Prisma.Decimal(0),
      ),
    };
  });

  const total = holdings.reduce(
    (prev, curr) =>
      curr.convertedValue ? prev.plus(curr.convertedValue) : prev,
    new Prisma.Decimal(0),
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
                Net Worth
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
          onClick={() => onNewHolding()}
        >
          <Plus />
          {holdingLabel}
        </Button>
      </header>

      <div className="p-5">
        {isFetching && (
          <div>
            <Skeleton className="mb-5 h-8 w-48" />
            <div className="mt-5 rounded-xl border">
              <TableSkeleton />
            </div>
          </div>
        )}

        {!isFetching && (
          <>
            <p className="text-muted-foreground">
              Total {holdingLabelPlural.toLocaleLowerCase()}
            </p>
            <p className="text-3xl font-medium">
              <RoundedCurrency value={total} />
            </p>
          </>
        )}

        {dataByCategory.map(({ category, results, total }) => (
          <Fragment key={category}>
            <p className="mt-10 text-sm font-medium first:mt-0">{category}</p>
            <div className="mt-5 rounded-xl border">
              <Table>
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
                      </TableCell>
                      <TableCell className="text-right">
                        <RoundedCurrency value={row.convertedValue} />
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
                            <DropdownMenuItem
                              onClick={() => onEditHolding(row)}
                            >
                              Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteHolding(row)}
                            >
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
            </div>
          </Fragment>
        ))}
      </div>
    </>
  );
}
