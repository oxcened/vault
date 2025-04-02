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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal, PencilIcon, Plus, Trash2Icon } from "lucide-react";
import EditExchangeRateDialog from "./EditExchangeRateDialog";
import { type ExchangeRate } from "@prisma/client";
import NewExchangeRateDialog from "./NewExchangeRateDialog";
import { TableSkeleton } from "~/components/table-skeleton";
import { toast } from "sonner";
import { Number } from "~/components/ui/number";

export default function ExchangeRatesPage() {
  const { data = [], refetch, isPending } = api.exchangeRate.getAll.useQuery();

  const { mutate: deleteExchangeRate } = api.exchangeRate.delete.useMutation({
    onSuccess: () => {
      toast.success("Exchange rate deleted.");
      void refetch();
    },
  });

  const [editingRate, setEditingRate] = useState<ExchangeRate>();
  const [isEditDialog, setEditDialog] = useState(false);

  function handleEditClick(rate: ExchangeRate) {
    setEditingRate(rate);
    setEditDialog(true);
  }

  const [isNewDialog, setNewDialog] = useState(false);

  const utils = api.useUtils();

  function handleRateCreatedOrEdited() {
    void refetch();
    void utils.netWorthOverview.get.invalidate();
    void utils.netWorthAsset.getAll.invalidate();
    void utils.netWorthAsset.getDetailById.invalidate();
    void utils.netWorthDebt.getAll.invalidate();
    void utils.netWorthDebt.getDetailById.invalidate();
    void utils.dashboard.getSummary.invalidate();
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Market data</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Exchange rates</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Button
          variant="outline"
          className="ml-auto"
          size="icon"
          onClick={() => setNewDialog(true)}
        >
          <Plus />
        </Button>
      </header>

      <div className="mx-auto w-full max-w-screen-md p-5">
        {isPending && <TableSkeleton />}
        {!isPending && !data.length && (
          <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don&apos;t have any exchange rates yet
          </div>
        )}
        {!isPending && !!data.length && (
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
                    <Number value={rate.rate} />
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditClick(rate)}>
                          <PencilIcon />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteExchangeRate({ id: rate.id })}
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
          </Table>
        )}
      </div>

      <EditExchangeRateDialog
        key={`edit-exchange-rate-dialog-${isEditDialog}`}
        isOpen={isEditDialog}
        exchangeRate={editingRate}
        onOpenChange={setEditDialog}
        onSuccess={handleRateCreatedOrEdited}
      />

      <NewExchangeRateDialog
        key={`new-exchange-rate-dialog-${isNewDialog}`}
        isOpen={isNewDialog}
        onOpenChange={setNewDialog}
        onSuccess={handleRateCreatedOrEdited}
      />
    </>
  );
}
