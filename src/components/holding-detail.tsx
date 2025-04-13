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
import { DECIMAL_ZERO } from "~/utils/number";
import { formatDate } from "~/utils/date";
import Decimal from "decimal.js";
import { Badge } from "~/components/ui/badge";
import {
  EditableValue,
  EditableValueDisplay,
  EditableValueInput,
} from "~/components/ui/editable-value";

export function HoldingDetail({
  holdingId,
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
  onQuantityChange,
}: {
  holdingId?: string;
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
  type: "asset" | "debt";
  onQuantityChange: (args: { quantity: string; timestamp: Date }) => void;
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
            <div className="flex gap-2">
              <div className="mr-auto">
                <p className="text-muted-foreground">{holdingName}</p>
                <p className="text-3xl">
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

            <div className="flex flex-col gap-5">
              <p className="font-medium">Value history</p>

              <HistoryTable
                ticker={ticker}
                isCategoryStock={isCategoryStock}
                valueHistory={valueHistory?.map((item) => ({
                  ...item,
                  timestamp: item.timestamp,
                }))}
                holdingId={holdingId}
                onQuantityChange={onQuantityChange}
              />
            </div>
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

export function HistoryTable({
  holdingId,
  isCategoryStock,
  valueHistory = [],
  ticker,
  onQuantityChange,
}: {
  holdingId?: string;
  isCategoryStock?: boolean;
  ticker?: string;
  valueHistory?: {
    timestamp: Date;
    quantity: Decimal;
    stockPrice?: Decimal | null;
    fxRate: Decimal | null;
    valueInTarget: Decimal;
  }[];
  onQuantityChange: (args: { quantity: string; timestamp: Date }) => void;
}) {
  const handleQuantityChange = ({
    row,
    quantity,
  }: {
    row: (typeof valueHistory)[number];
    quantity: string;
  }) => {
    if (!holdingId || !row.timestamp) return;
    onQuantityChange({
      timestamp: row.timestamp,
      quantity: quantity,
    });
  };

  return (
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
          <TableRow key={row.timestamp.getTime()}>
            <TableCell>
              {row.timestamp ? formatDate({ date: row.timestamp }) : "n/a"}
            </TableCell>
            {isCategoryStock && (
              <TableCell className="text-xs">
                <Badge variant="outline">
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
              <EditableValue
                initialValue={(row.quantity ?? DECIMAL_ZERO).toString()}
                onCommit={(quantity) =>
                  handleQuantityChange({
                    quantity,
                    row,
                  })
                }
              >
                <EditableValueInput className="ml-auto h-9 text-end" />
                <EditableValueDisplay
                  className="flex h-9 flex-col justify-center"
                  render={() => (
                    <>
                      <Currency value={row.valueInTarget} />

                      {isCategoryStock && (
                        <p className="text-xs text-muted-foreground">
                          Qty <Number value={row.quantity} />
                        </p>
                      )}
                    </>
                  )}
                />
              </EditableValue>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
