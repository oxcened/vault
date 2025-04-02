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
import EditStockPriceDialog from "./EditStockPriceDialog";
import { type StockPriceHistory } from "@prisma/client";
import NewStockPriceDialog from "./NewStockPriceDialog";
import { TableSkeleton } from "~/components/table-skeleton";
import { toast } from "sonner";
import { Number } from "~/components/ui/number";

export default function StockPricesPage() {
  const { data = [], refetch, isPending } = api.stockPrice.getAll.useQuery();

  const { mutate: deleteStockPrice } = api.stockPrice.delete.useMutation({
    onSuccess: () => {
      toast.success("Stock price deleted.");
      void refetch();
    },
  });

  const utils = api.useUtils();

  const [editingPrice, setEditingPrice] = useState<StockPriceHistory>();
  const [isNewDialogOpen, setNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  function handleStockCreatedOrEdited() {
    void refetch();
    void utils.netWorthOverview.get.invalidate();
    void utils.netWorthAsset.getAll.invalidate();
    void utils.netWorthAsset.getDetailById.invalidate();
    void utils.dashboard.getSummary.invalidate();
  }

  function handleEditClick(stockPrice: StockPriceHistory) {
    setEditingPrice(stockPrice);
    setEditDialogOpen(true);
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
              <BreadcrumbPage>Stock prices</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setNewDialogOpen(true)}
          >
            <Plus />
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-screen-md p-5">
        {isPending && <TableSkeleton />}
        {!isPending && !data.length && (
          <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don&apos;t have any stock prices yet
          </div>
        )}
        {!isPending && !!data.length && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Exchange</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((price) => (
                <TableRow key={price.id}>
                  <TableCell>{price.ticker.ticker}</TableCell>
                  <TableCell>{price.ticker.exchange}</TableCell>
                  <TableCell className="text-right">
                    <Number value={price.price} />
                  </TableCell>
                  <TableCell>{formatDate({ date: price.timestamp })}</TableCell>
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
                        <DropdownMenuItem
                          onClick={() => handleEditClick(price)}
                        >
                          <PencilIcon />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteStockPrice({ id: price.id })}
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

      <NewStockPriceDialog
        key={`new-stock-price-dialog-${isNewDialogOpen}`}
        isOpen={isNewDialogOpen}
        onOpenChange={() => setNewDialogOpen(false)}
        onSuccess={handleStockCreatedOrEdited}
      />

      <EditStockPriceDialog
        key={`edit-stock-price-dialog-${isEditDialogOpen}`}
        isOpen={isEditDialogOpen}
        stockPrice={editingPrice}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleStockCreatedOrEdited}
      />
    </>
  );
}
