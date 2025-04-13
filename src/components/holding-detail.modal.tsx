import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "~/components/ui/tabs";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { formatDate } from "~/utils/date";
import { APP_CURRENCY } from "~/constants";
import { Currency } from "~/components/ui/number";
import { Number } from "~/components/ui/number";
import { ScrollArea } from "~/components/ui/scroll-area";
import Decimal from "decimal.js";
import { PropsWithChildren } from "react";
import { DateTime } from "luxon";
import { DECIMAL_ZERO } from "~/utils/number";
import { Skeleton } from "./ui/skeleton";
import {
  EditableValue,
  EditableValueDisplay,
  EditableValueInput,
} from "./ui/editable-value";
import { Badge } from "./ui/badge";

export type AssetDetailDialogProps = PropsWithChildren<{
  isOpen: boolean;
  holdingName?: string;
  holdingComputedValue?: Decimal;
  holdingCurrency?: string;
  holdingNativeComputedValue?: Decimal;
  categoryName?: string;
  isPending: boolean;
  onOpenChange: (newOpen: boolean) => void;
}>;

export function HoldingDetailDialog({
  isOpen,
  holdingCurrency,
  holdingComputedValue,
  holdingNativeComputedValue,
  holdingName,
  categoryName,
  children,
  isPending,
  onOpenChange,
}: AssetDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        {isPending ? (
          <>
            <DialogHeader>
              <DialogTitle>Please wait...</DialogTitle>
            </DialogHeader>

            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{holdingName}</DialogTitle>
              <DialogDescription>
                <Currency
                  value={holdingComputedValue}
                  options={{
                    maximumFractionDigits: 2,
                  }}
                />
                {holdingCurrency !== APP_CURRENCY && (
                  <>
                    &nbsp;&middot;&nbsp;
                    <Currency
                      value={holdingNativeComputedValue}
                      options={{
                        currency: holdingCurrency,
                        maximumFractionDigits: 2,
                      }}
                    />
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="main">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="main">{categoryName}</TabsTrigger>
                <TabsTrigger value="value">Value</TabsTrigger>
              </TabsList>

              {children}
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const HoldingDetailMainTab = ({
  holdingId,
  ticker,
  tickerName,
  tickerExchange,
  isCategoryStock,
  onQuantityChange,
  holdingCurrency,
  latestStockPrice,
  latestQuantity,
}: {
  holdingId?: string;
  holdingCurrency?: string;
  tickerName?: string;
  ticker?: string;
  tickerExchange?: string;
  isCategoryStock?: boolean;
  latestStockPrice?: Decimal;
  latestQuantity?: Decimal;
  onQuantityChange: (args: { quantity: string; timestamp: Date }) => void;
}) => {
  return (
    <TabsContent value="main">
      {isCategoryStock && (
        <div className="mb-2 flex items-center justify-between rounded-lg border p-5 text-sm">
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

      <form>
        <div className="space-y-1">
          <Label htmlFor="quantity">Quantity/Value</Label>
          <Input
            id="quantity"
            placeholder="Quantity/Value"
            defaultValue={(latestQuantity ?? DECIMAL_ZERO).toNumber()}
            onChange={(e) => {
              if (!holdingId) return;
              onQuantityChange({
                timestamp: DateTime.utc().startOf("day").toJSDate(),
                quantity: e.currentTarget.value,
              });
            }}
          />
        </div>
      </form>
    </TabsContent>
  );
};

export const HoldingDetailValueTab = ({
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
}) => {
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
    <TabsContent value="value">
      <div className="mt-5 rounded-md border">
        <ScrollArea className="h-[12rem]">
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
                    {row.timestamp
                      ? formatDate({ date: row.timestamp })
                      : "n/a"}
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
        </ScrollArea>
      </div>
    </TabsContent>
  );
};
