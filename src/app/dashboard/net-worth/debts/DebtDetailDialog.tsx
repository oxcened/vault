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
import { ScrollArea } from "~/components/ui/scroll-area";

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
            <Currency value={data?.computedValue} />
            {data?.currency !== APP_CURRENCY && (
              <>
                &nbsp;&middot;&nbsp;
                <Currency
                  value={data?.nativeComputedValue}
                  options={{
                    currency: data?.currency,
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
                      <TableRow key={row.quantityId}>
                        <TableCell>
                          {row.timestamp
                            ? formatDate({ date: row.timestamp })
                            : "n/a"}
                        </TableCell>
                        <TableCell className="text-right">
                          <p>
                            <Currency value={row.computedValue} />
                          </p>
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
