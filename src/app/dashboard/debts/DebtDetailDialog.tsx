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

export type DebtDetailDialogProps = {
  isOpen: boolean;
  debtId?: string;
  onOpenChange: (newOpen: boolean) => void;
};

export function DebtDetailDialog({
  isOpen,
  debtId,
  onOpenChange,
}: DebtDetailDialogProps) {
  const { data, isPending } = api.netWorthDebt.getDetailById.useQuery(
    { id: debtId! },
    { enabled: !!debtId },
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
            {formatCurrency({ value: data?.computedValue ?? 0 })}
            {data?.currency !== APP_CURRENCY && (
              <>
                &nbsp;&middot;&nbsp;
                {formatCurrency({
                  value: data?.nativeComputedValue ?? 0,
                  options: { currency: data?.currency },
                })}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="main">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">{data?.type}</TabsTrigger>
            <TabsTrigger value="value">Value</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <form>
              <div className="space-y-1">
                <Label htmlFor="balance">Balance</Label>
                <Input
                  id="balance"
                  placeholder="Balance"
                  defaultValue={Number(data?.latestQuantity?.quantity ?? 0)}
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
                    <TableRow key={row.quantityId}>
                      <TableCell>
                        {row.timestamp
                          ? formatDate({ date: row.timestamp })
                          : "n/a"}
                      </TableCell>
                      <TableCell className="text-right">
                        <p>
                          {formatCurrency({
                            value: row.computedValue ?? 0,
                          })}
                        </p>
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
