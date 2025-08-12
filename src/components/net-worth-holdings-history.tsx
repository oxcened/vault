"use client";

import { Prisma } from "@prisma/client";
import { format, lastDayOfMonth } from "date-fns";
import { CalendarIcon, FilterIcon } from "lucide-react";
import { useState } from "react";
import { TableSkeleton } from "~/components/table-skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MonthPicker } from "~/components/ui/month-picker";
import { RoundedCurrency } from "~/components/ui/number";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
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
import { useBreakpoint } from "~/hooks/useBreakpoint";
import { cn } from "~/lib/utils";
import { DECIMAL_ZERO } from "~/utils/number";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

export type NetWorthHoldingsHistoryProps = {
  data: {
    id: string;
    name: string;
    categoryName: string | null;
    value: Prisma.Decimal;
  }[];
  isFetching: boolean;
  date: Date;
  type: "asset" | "debt";
  onDateChange: (date: Date) => void;
};

export default function NetWorthHoldingsHistory({
  data = [],
  isFetching,
  date,
  type,
  onDateChange,
}: NetWorthHoldingsHistoryProps) {
  const [hideZeroItems, setHideZeroItems] = useState(true);

  const filteredData = data.filter((row) => {
    if (!hideZeroItems) return true;
    return !row.value.eq(DECIMAL_ZERO);
  });

  const { sm } = useBreakpoint();

  const total = data.reduce(
    (prev, curr) => prev.plus(curr.value),
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
              <BreadcrumbPage>
                {type === "asset" ? "Assets" : "Debts"} history
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-2 p-5">
        <div className="flex flex-row justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FilterIcon />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                Filter {type === "asset" ? "assets" : "debts"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={hideZeroItems}
                onCheckedChange={setHideZeroItems}
              >
                Hide zero {type === "asset" ? "assets" : "debts"}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size={sm ? "default" : "icon"}
                className={cn("font-normal", !date && "text-muted-foreground")}
              >
                <span className="hidden sm:inline">
                  {date ? format(date, "MMMM yyyy") : <span>Pick a date</span>}
                </span>
                <CalendarIcon className="sm:opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <MonthPicker
                value={date}
                disabled={(date) => date > new Date()}
                onChange={(date) => onDateChange(lastDayOfMonth(date))}
              />
            </PopoverContent>
          </Popover>
        </div>

        {isFetching ? (
          <TableSkeleton />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{type === "asset" ? "Asset" : "Debt"}</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-0 text-end">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row) => {
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.categoryName}</Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <RoundedCurrency value={row.value} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-end">
                    <RoundedCurrency value={total} />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Card>
        )}
      </div>
    </>
  );
}
