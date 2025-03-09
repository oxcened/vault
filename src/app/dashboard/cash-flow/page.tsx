"use client";

import { SidebarTrigger } from "~/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";
import { TableSkeleton } from "~/components/table-skeleton";
import { Currency, RoundedCurrency } from "~/components/ui/number";
import { cn } from "~/lib/utils";

export default function CashFlowPage() {
  const { data, isLoading } = api.cashFlow.getMonthlyCashFlow.useQuery();

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/net-worth">
                Cash flow
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto w-full max-w-screen-md p-5">
        {isLoading && <TableSkeleton />}
        {!isLoading && (
          <>
            <p className="text-muted-foreground">Cash flow</p>
            <p className="text-3xl">
              <RoundedCurrency value={data?.savings} />
            </p>
          </>
        )}
        {!isLoading && !data?.cashFlow?.length && (
          <div className="mt-10 rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don't have a cash flow yet
          </div>
        )}
        {!isLoading && !!data?.cashFlow?.length && (
          <>
            <Table className="mt-10">
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-32 text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cashFlow.map((category) => (
                  <TableRow key={category.category}>
                    <TableCell>{category.category}</TableCell>
                    <TableCell className="text-right">
                      <Currency
                        value={category.netAmount}
                        className={cn(
                          "text-right",
                          category.netAmount.isPos() &&
                            "text-financial-positive",
                          category.netAmount.isNeg() &&
                            "text-financial-negative",
                        )}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total income</TableCell>
                  <TableCell className="text-right">
                    <Currency value={data.totalEarned} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total expenses</TableCell>
                  <TableCell className="text-right">
                    <Currency value={data.totalSpent} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cash flow</TableCell>
                  <TableCell className="text-right">
                    <Currency value={data.savings} />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </>
        )}
      </div>
    </>
  );
}
