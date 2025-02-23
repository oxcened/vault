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
import { api } from "~/trpc/react";
import { defaultCurrencyOptions, formatCurrency } from "~/utils/currency";
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
import { formatNumber } from "~/utils/number";

function getTypeLabel(type: string) {
  switch (type) {
    case "stock":
      return "Stock";
    case "account":
      return "Account";
    case "miscellaneous":
      return "Miscellaneous";
    default:
      return "Asset";
  }
}

export type AssetDetailDialogProps = {
  isOpen: boolean;
  assetId?: string;
  onOpenChange: (newOpen: boolean) => void;
};

export function AssetDetailDialog({
  isOpen,
  assetId,
  onOpenChange,
}: AssetDetailDialogProps) {
  const { data, isPending } = api.netWorthAsset.getDetailById.useQuery(
    {
      id: assetId!,
    },
    {
      enabled: !!assetId,
    },
  );

  if (isPending) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data?.name}</DialogTitle>
          <DialogDescription>
            {formatCurrency({
              value: data?.computedValue ?? 0,
            })}
            {data?.currency !== APP_CURRENCY && (
              <>
                &nbsp;&middot;&nbsp;
                {formatCurrency({
                  value: data?.nativeComputedValue ?? 0,
                  options: {
                    currency: data?.currency,
                  },
                })}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="stock">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">
              {getTypeLabel(data?.type ?? "")}
            </TabsTrigger>
            <TabsTrigger value="value">Value</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            {data?.type === "stock" && (
              <div className="flex items-center justify-between rounded-lg border bg-neutral-100 p-5 text-sm">
                <div>
                  <p>{data?.ticker?.name}</p>
                  <p className="text-neutral-500">
                    {data?.ticker?.ticker} &middot; {data?.ticker?.exchange}
                  </p>
                </div>
                <p>
                  {formatCurrency({
                    value: data.latestStockPrice?.price ?? 0,
                    options: {
                      ...defaultCurrencyOptions,
                      currency: data.currency,
                      maximumFractionDigits: 2,
                    },
                  })}
                </p>
              </div>
            )}

            <form>
              <div className="space-y-1">
                <Label htmlFor="quantity">Quantity/Value</Label>
                <Input
                  id="quantity"
                  placeholder="Quantity/Value"
                  defaultValue={Number(data?.latestQuantity?.quantity)}
                />
              </div>
            </form>
          </TabsContent>

          <TabsContent value="value">
            <div className="mt-5 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.valueHistory.map((row) => (
                    <TableRow key={[row.quantityId, row.stockPriceId].join()}>
                      <TableCell>
                        {row.timestamp
                          ? formatDate({ date: row.timestamp })
                          : "n/a"}
                      </TableCell>
                      <TableCell className="text-right">
                        <p>
                          {formatCurrency({
                            value: row.computedValue ?? 0,
                            options: {},
                          })}
                        </p>
                        {data?.type?.toLowerCase() === "stock" && (
                          <p className="text-xs text-neutral-500">
                            Qty {formatNumber({ value: row.quantity ?? 0 })}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
