import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { RoundedCurrency } from "~/components/ui/number";
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
import { api } from "~/trpc/server";
import { formatDate } from "~/utils/date";

export default async function CashFlowHistoryPage() {
  const data = await api.cashFlow.getAll();

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
              <BreadcrumbPage>Cash flow history</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="mx-auto w-full max-w-screen-md p-5">
        {!data.length && (
          <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
            You don&apos;t have a cash flow history yet
          </div>
        )}
        {!!data.length && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="w-32 text-right">Income</TableHead>
                <TableHead className="w-32 text-right">Expenses</TableHead>
                <TableHead className="w-32 text-right">Cash flow</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate({ date: row.timestamp })}</TableCell>
                  <TableCell className="text-right">
                    <RoundedCurrency value={row.income} />
                  </TableCell>
                  <TableCell className="text-right">
                    <RoundedCurrency value={row.expenses} />
                  </TableCell>
                  <TableCell className="text-right">
                    <RoundedCurrency value={row.netFlow} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
