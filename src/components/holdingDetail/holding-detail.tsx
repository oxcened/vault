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
import { Currency, RoundedCurrency } from "~/components/ui/number";
import { formatDate } from "~/utils/date";
import type Decimal from "decimal.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal, PlusIcon } from "lucide-react";
import { useConfirmDelete } from "../confirm-delete-modal";
import { Card } from "../ui/card";
import { cn } from "~/lib/utils";
import { DataSourceBadge } from "./data-source-badge";
import { DeltaPopup } from "./delta-popup";
import { ValuePopup } from "./value-popup";
import { ValueChangePopup } from "./value-change-popup";

export type ValueHistoryRow = {
  timestamp: Date;
  quantity: Decimal;
  quantityId: string | null;
  quantityIsCarried: boolean | null;
  stockPrice?: Decimal | null;
  stockPriceId?: string | null;
  stockPriceIsCarried?: boolean | null;
  fxRate: Decimal | null;
  fxRateId: string | null;
  fxRateIsCarried: boolean | null;
  valueInTarget: Decimal;
};

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
  valueHistory?: ValueHistoryRow[];
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
      </header>

      <div className="mx-auto w-full max-w-screen-md p-5">
        {isPending && <TableSkeleton />}

        {!isPending && (
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="mr-auto">
                <p className="text-sm text-muted-foreground">{holdingName}</p>
                <p className="text-3xl font-semibold">
                  <RoundedCurrency value={holdingComputedValue} />
                </p>
              </div>

              <Button variant="default" onClick={onNewHolding}>
                <PlusIcon />
                Add
              </Button>
            </div>

            <Overview
              holdingCurrency={holdingCurrency}
              isCategoryStock={isCategoryStock}
              latestStockPrice={latestStockPrice}
              ticker={ticker}
              tickerName={tickerName}
              tickerExchange={tickerExchange}
            />

            <ValueHistoryTable
              valueHistory={valueHistory}
              onQuantityEdit={onQuantityEdit}
              onQuantiyDelete={onQuantityDelete}
            />
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
  valueHistory = [],
  onQuantityEdit,
  onQuantiyDelete,
}: {
  valueHistory?: ValueHistoryRow[];
  onQuantiyDelete: (args: { timestamp: Date }) => void;
  onQuantityEdit: (args: { id: string }) => void;
}) {
  const { confirm, modal } = useConfirmDelete();

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
            <TableHead>Data sources</TableHead>
            <TableHead className="text-end">Change</TableHead>
            <TableHead className="text-end">Value</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {valueHistory.map((row, index) => {
            const previousRow = valueHistory[index + 1];
            const previousDelta = previousRow
              ? row.valueInTarget.minus(previousRow.valueInTarget)
              : undefined;

            return (
              <TableRow key={row.timestamp.getTime()} className="h-[49px]">
                <TableCell>
                  {row.timestamp ? formatDate({ date: row.timestamp }) : "n/a"}
                </TableCell>

                <TableCell>
                  <div className="flex gap-1">
                    {row.quantity && (
                      <DataSourceBadge
                        label="Qty"
                        isCarried={row.quantityIsCarried}
                      />
                    )}
                    {row.stockPrice && (
                      <DataSourceBadge
                        label="Stock"
                        isCarried={row.stockPriceIsCarried}
                      />
                    )}
                    {row.fxRate && (
                      <DataSourceBadge
                        label="FX"
                        isCarried={row.fxRateIsCarried}
                      />
                    )}

                    <DeltaPopup row={row} previousRow={previousRow} />
                  </div>
                </TableCell>

                <TableCell className="text-end">
                  {previousDelta && previousRow ? (
                    <div className="inline-flex w-fit items-center gap-1">
                      <Currency
                        value={previousDelta}
                        className={cn(
                          previousDelta.isPos() && "text-financial-positive",
                          previousDelta.isNeg() && "text-financial-negative",
                        )}
                        options={{
                          signDisplay: "always",
                        }}
                      />

                      <ValueChangePopup row={row} previousRow={previousRow} />
                    </div>
                  ) : (
                    "–"
                  )}
                </TableCell>

                <TableCell className="text-end">
                  <div className="inline-flex w-fit items-center gap-1">
                    <Currency value={row.valueInTarget} />
                    <ValuePopup row={row} />
                  </div>
                </TableCell>

                <TableCell>
                  {row.quantityId && !row.quantityIsCarried && (
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
                              id: row.quantityId!,
                            })
                          }
                        >
                          Edit quantity
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() =>
                            confirm({
                              itemType: "value",
                              itemName: formatDate({ date: row.timestamp }),
                              onConfirm: () =>
                                onQuantiyDelete({ timestamp: row.timestamp }),
                            })
                          }
                        >
                          Delete quantity
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {modal}
    </Card>
  );
}
