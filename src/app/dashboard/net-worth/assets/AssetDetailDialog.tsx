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
import { useDebouncedCallback } from "use-debounce";
import Decimal from "decimal.js";
import { toast } from "sonner";

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
  const { data, isPending, refetch } = api.netWorthAsset.getDetailById.useQuery(
    {
      id: assetId!,
    },
    {
      enabled: !!assetId,
    },
  );
  const { mutate: updateQuantity } =
    api.netWorthAsset.updateQuantity.useMutation({
      onSuccess: () => {
        void refetch();
        void utils.netWorthOverview.get.invalidate();
        void utils.dashboard.getSummary.invalidate();
        void utils.netWorthAsset.getAll.invalidate();
        void utils.netWorth.getAll.invalidate();
      },
    });
  const utils = api.useUtils();

  const handleQuantityChange = useDebouncedCallback((value: string) => {
    try {
      const decimalValue = new Decimal(value);
      if (!assetId) throw new Error("Asset ID not found");
      updateQuantity({
        assetId,
        quantity: decimalValue.toString(),
      });
    } catch (error) {
      const msg = `Invalid decimal input: ${value}`;
      console.error(msg);
      toast.error(msg);
    }
  }, 1000);

  if (isPending) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data?.name}</DialogTitle>
          <DialogDescription>
            <Currency
              value={data?.computedValue}
              options={{
                maximumFractionDigits: 2,
              }}
            />
            {data?.currency !== APP_CURRENCY && (
              <>
                &nbsp;&middot;&nbsp;
                <Currency
                  value={data?.nativeComputedValue}
                  options={{
                    currency: data?.currency,
                    maximumFractionDigits: 2,
                  }}
                />
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="main">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">{data?.category?.name}</TabsTrigger>
            <TabsTrigger value="value">Value</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            {data?.category?.isStock && (
              <div className="mb-2 flex items-center justify-between rounded-lg border p-5 text-sm">
                <div>
                  <p>{data?.ticker?.name}</p>
                  <p className="text-muted-foreground">
                    {data?.ticker?.ticker} &middot; {data?.ticker?.exchange}
                  </p>
                </div>
                <p>
                  <Currency
                    value={data.latestStockPrice?.price}
                    options={{
                      currency: data.currency,
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
                  defaultValue={data?.latestQuantity?.quantity?.toNumber()}
                  onChange={(e) => handleQuantityChange(e.currentTarget.value)}
                />
              </div>
            </form>
          </TabsContent>

          <TabsContent value="value">
            <div className="mt-5 rounded-md border">
              <ScrollArea className="h-[12rem]">
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
                            <Currency
                              value={row.computedValue}
                              options={{
                                maximumFractionDigits: 2,
                              }}
                            />
                          </p>
                          {data?.category?.isStock && (
                            <p className="text-xs text-muted-foreground">
                              Qty <Number value={row.quantity} />
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
