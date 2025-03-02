import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Currency } from "~/components/ui/currency";
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
              <BreadcrumbLink href="/dashboard/net-worth">
                Net Worth
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>History</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="p-5">
        <div className="mt-5 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Net Worth</TableHead>
                <TableHead className="w-24 text-right">Assets</TableHead>
                <TableHead className="w-24 text-right">Debts</TableHead>
                <TableHead className="w-24 text-right">Net value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate({ date: row.timestamp })}</TableCell>
                  <TableCell className="text-right">
                    <Currency value={row.totalAssets} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Currency value={row.totalDebts} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Currency value={row.netValue} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>All time high</TableCell>
                <TableCell className="text-right">
                  <Currency value={athAssets} />
                </TableCell>
                <TableCell className="text-right">
                  <Currency value={athDebts} />
                </TableCell>
                <TableCell className="text-right">
                  <Currency value={athNetValue} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </>
  );
}
