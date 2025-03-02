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
import { api } from "~/trpc/react";
import NewDebtDialog from "./NewDebtDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { NetWorthAsset, Prisma } from "@prisma/client";
import { DebtDetailDialog } from "./DebtDetailDialog";
import { Skeleton } from "~/components/ui/skeleton";
import { TableSkeleton } from "~/components/table-skeleton";
import { toast } from "sonner";
import { Currency } from "~/components/ui/currency";

export default function AssetsPage() {
  const { data = [], refetch, isPending } = api.netWorthDebt.getAll.useQuery();

  const { mutate: deleteDebt } = api.netWorthDebt.delete.useMutation({
    onSuccess: () => {
      toast.success("Debt deleted.");
      void refetch();
    },
  });

  const [detailsDialog, setDetailsDialog] = useState<NetWorthAsset["id"]>();
  const [newDialog, setNewDialog] = useState(false);

  const categories = [...new Set(data.map((item) => item.category))];

  const dataByCategory = categories.map((category) => {
    const results = data.filter((item) => item.category === category);
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

  const total = data.reduce(
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
              <BreadcrumbPage>Debts</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Button
          variant="outline"
          className="ml-auto"
          onClick={() => setNewDialog(true)}
        >
          <Plus />
          Debt
        </Button>
      </header>

      <div className="p-5">
        {isPending && (
          <div>
            <Skeleton className="mb-5 h-8 w-48" />
            <div className="mt-5 rounded-xl border">
              <TableSkeleton />
            </div>
          </div>
        )}

        {!isPending && (
          <>
            <p className="text-muted-foreground">Total debts</p>
            <p className="text-3xl font-medium">
              <Currency value={total} />
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
                    <TableHead>Asset</TableHead>
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
                        <Currency value={row.convertedValue} />
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
                              onClick={() => setDetailsDialog(row.id)}
                            >
                              Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteDebt(row)}>
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
                      <Currency value={total} />
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </Fragment>
        ))}
      </div>

      <NewDebtDialog
        isOpen={newDialog}
        onOpenChange={setNewDialog}
        onSuccess={refetch}
      />

      <DebtDetailDialog
        isOpen={!!detailsDialog}
        debtId={detailsDialog}
        onOpenChange={() => setDetailsDialog(undefined)}
      />
    </>
  );
}
