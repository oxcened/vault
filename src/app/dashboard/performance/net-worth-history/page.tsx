import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Card } from "~/components/ui/card";
import { RoundedCurrency } from "~/components/ui/number";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/server";
import { formatDate } from "~/utils/date";

export default async function NwHistoryPage() {
  const data = await api.netWorth.getAll();
  const athAssets = Math.max(...data.map((item) => Number(item.totalAssets)));
  const athDebts = Math.max(...data.map((item) => Number(item.totalDebts)));
  const athNetValue = Math.max(...data.map((item) => Number(item.netValue)));

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbPage>Performance & History</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Net worth history</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="mx-auto w-full max-w-screen-md p-5">
        {!data.length && (
          <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don&apos;t have a net worth history yet
          </div>
        )}
        {!!data.length && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-32 text-right">Assets</TableHead>
                  <TableHead className="w-32 text-right">Debts</TableHead>
                  <TableHead className="w-32 text-right">Net value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate({ date: row.timestamp })}</TableCell>
                    <TableCell className="text-right">
                      <RoundedCurrency value={row.totalAssets} />
                    </TableCell>
                    <TableCell className="text-right">
                      <RoundedCurrency value={row.totalDebts} />
                    </TableCell>
                    <TableCell className="text-right">
                      <RoundedCurrency value={row.netValue} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>All time high</TableCell>
                  <TableCell className="text-right">
                    <RoundedCurrency value={athAssets} />
                  </TableCell>
                  <TableCell className="text-right">
                    <RoundedCurrency value={athDebts} />
                  </TableCell>
                  <TableCell className="text-right">
                    <RoundedCurrency value={athNetValue} />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Card>
        )}
      </div>
    </>
  );
}
