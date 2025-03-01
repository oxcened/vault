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
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { formatDate } from "~/utils/date";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import EditExchangeRateDialog, {
  EditExchangeRateDialogProps,
} from "./EditExchangeRateDialog";
import { ExchangeRate } from "@prisma/client";
import NewExchangeRateDialog from "./NewExchangeRateDialog";
import { TableSkeleton } from "~/components/table-skeleton";

export default function ExchangeRatesPage() {
  // Query all exchange rates.
  const { data = [], refetch, isPending } = api.exchangeRate.getAll.useQuery();

  // Delete mutation.
  const { mutate: deleteExchangeRate } = api.exchangeRate.delete.useMutation({
    onSuccess: () => refetch(),
  });

  // State for editing exchange rate.
  const [editingRate, setEditingRate] =
    useState<EditExchangeRateDialogProps["initialData"]>();

  function handleEditClick(rate: ExchangeRate) {
    setEditingRate({
      ...rate,
      rate: rate.rate.toNumber(),
    });
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/net-worth">
                Net Worth
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Exchange Rates</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <NewExchangeRateDialog onSuccess={refetch} />
      </header>

      <div className="m-5 rounded-md border">
        {isPending && <TableSkeleton />}
        {!isPending && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Base Currency</TableHead>
                <TableHead>Quote Currency</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{rate.baseCurrency}</TableCell>
                  <TableCell>{rate.quoteCurrency}</TableCell>
                  <TableCell className="text-right">
                    {rate.rate.toString()}
                  </TableCell>
                  <TableCell>{formatDate({ date: rate.timestamp })}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEditClick(rate)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteExchangeRate({ id: rate.id })}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {editingRate && (
        <EditExchangeRateDialog
          initialData={editingRate}
          onClose={() => setEditingRate(undefined)}
          onSuccess={() => {
            setEditingRate(undefined);
            void refetch();
          }}
        />
      )}
    </>
  );
}
