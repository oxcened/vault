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
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TableSkeleton } from "~/components/table-skeleton";
import { Currency, Number, RoundedCurrency } from "~/components/ui/number";
import { formatDate } from "~/utils/date";
import Decimal from "decimal.js";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { MoreHorizontal, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useConfirmDelete } from "./confirm-delete-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";

export function HoldingDetail({
  holdingCurrency,
  holdingComputedValue,
  holdingName,
  isCategoryStock = false,
  isPending,
  latestStockPrice,
  ticker,
  tickerExchange,
  tickerName,
  valueHistory,
  type,
  quantityHistory,
  onQuantityEdit,
  onQuantityDelete,
  onNewHolding,
}: {
  holdingName?: string;
  isPending: boolean;
  holdingComputedValue?: Decimal;
  holdingCurrency?: string;
  isCategoryStock?: boolean;
  ticker?: string;
  tickerName?: string;
  tickerExchange?: string;
  latestStockPrice?: Decimal;
  valueHistory?: {
    timestamp: Date;
    quantity: Decimal;
    stockPrice?: Decimal | null;
    fxRate: Decimal | null;
    valueInTarget: Decimal;
  }[];
  quantityHistory?: {
    quantity: Decimal;
    id: string;
    timestamp: Date;
  }[];
  type: "asset" | "debt";
  onQuantityEdit: (args: { id: string }) => void;
  onQuantityDelete: (args: { timestamp: Date }) => void;
  onNewHolding: () => void;
}) {
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
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink
                href={`/dashboard/net-worth/${type === "asset" ? "assets" : "debts"}`}
              >
                {type === "asset" ? "Assets" : "Debts"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{holdingName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Button
          variant="outline"
          className="ml-auto"
          size="icon"
          onClick={onNewHolding}
        >
          <PlusIcon />
        </Button>
      </header>

      <div className="mx-auto w-full max-w-screen-md p-5">
        {isPending && <TableSkeleton />}

        {!isPending && (
          <div className="flex flex-col gap-10">
            <div className="flex gap-2">
              <div className="mr-auto">
                <p className="text-sm text-muted-foreground">{holdingName}</p>
                <p className="text-3xl font-semibold">
                  <RoundedCurrency value={holdingComputedValue} />
                </p>
              </div>
            </div>

            <Overview
              holdingCurrency={holdingCurrency}
              isCategoryStock={isCategoryStock}
              latestStockPrice={latestStockPrice}
              ticker={ticker}
              tickerName={tickerName}
              tickerExchange={tickerExchange}
            />

            <Tabs defaultValue="value">
              <TabsList>
                <TabsTrigger value="value">Value history</TabsTrigger>
                <TabsTrigger value="quantity">Quantity history</TabsTrigger>
              </TabsList>
              <TabsContent value="value">
                <ValueHistoryTable
                  ticker={ticker}
                  isCategoryStock={isCategoryStock}
                  valueHistory={valueHistory}
                />
              </TabsContent>
              <TabsContent value="quantity">
                <QuantityHistoryTable
                  valueHistory={quantityHistory}
                  onQuantityEdit={onQuantityEdit}
                  onQuantiyDelete={onQuantityDelete}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </>
  );
}

export function Overview({
  ticker,
  tickerName,
  tickerExchange,
  isCategoryStock,
  holdingCurrency,
  latestStockPrice,
}: {
  holdingCurrency?: string;
  tickerName?: string;
  ticker?: string;
  tickerExchange?: string;
  isCategoryStock?: boolean;
  latestStockPrice?: Decimal;
}) {
  return (
    <>
      {isCategoryStock && (
        <div className="flex items-center justify-between rounded-lg border p-5 text-sm">
          <div>
            <p>{tickerName}</p>
            <p className="text-muted-foreground">
              {ticker} &middot; {tickerExchange}
            </p>
          </div>
          <p>
            <Currency
              value={latestStockPrice}
              options={{
                currency: holdingCurrency,
                maximumFractionDigits: 2,
              }}
            />
          </p>
        </div>
      )}
    </>
  );
}

export function ValueHistoryTable({
  isCategoryStock,
  valueHistory = [],
  ticker,
}: {
  isCategoryStock?: boolean;
  ticker?: string;
  valueHistory?: {
    timestamp: Date;
    quantity: Decimal;
    stockPrice?: Decimal | null;
    fxRate: Decimal | null;
    valueInTarget: Decimal;
  }[];
}) {
  if (!valueHistory.length) {
    return (
      <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
        You don&apos;t have a value history yet
      </div>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {isCategoryStock && <TableHead>Stock</TableHead>}
            <TableHead className="text-end">Value</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {valueHistory.map((row) => (
            <TableRow key={row.timestamp.getTime()} className="h-[49px]">
              <TableCell>
                {row.timestamp ? formatDate({ date: row.timestamp }) : "n/a"}
              </TableCell>
              {isCategoryStock && (
                <TableCell>
                  <Badge variant="secondary">
                    {ticker}&nbsp;
                    <Number
                      value={row.stockPrice}
                      options={{
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }}
                    />
                  </Badge>
                </TableCell>
              )}
              <TableCell className="text-end">
                <Currency value={row.valueInTarget} />

                {isCategoryStock && (
                  <p className="text-xs text-muted-foreground">
                    Qty <Number value={row.quantity} />
                  </p>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function QuantityHistoryTable({
  valueHistory = [],
  onQuantiyDelete,
  onQuantityEdit,
}: {
  valueHistory?: {
    quantity: Decimal;
    id: string;
    timestamp: Date;
  }[];
  onQuantiyDelete: (args: { timestamp: Date }) => void;
  onQuantityEdit: (args: { id: string }) => void;
}) {
  const { confirm, modal } = useConfirmDelete();

  if (!valueHistory.length) {
    return (
      <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
        You don&apos;t have a quantity history yet
      </div>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-end">Value</TableHead>
            <TableHead className="w-0"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {valueHistory.map((row) => (
            <TableRow key={row.timestamp.getTime()}>
              <TableCell>
                {row.timestamp ? formatDate({ date: row.timestamp }) : "n/a"}
              </TableCell>
              <TableCell className="text-end">
                <Number value={row.quantity} />
              </TableCell>
              <TableCell className="w-0">
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
                      onClick={() =>
                        onQuantityEdit({
                          id: row.id,
                        })
                      }
                    >
                      <PencilIcon />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        confirm({
                          itemType: "value",
                          itemName: formatDate({ date: row.timestamp }),
                          onConfirm: () =>
                            onQuantiyDelete({ timestamp: row.timestamp }),
                        })
                      }
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

        {modal}
      </Table>
    </Card>
  );
}
