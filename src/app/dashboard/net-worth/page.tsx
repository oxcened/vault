import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { api } from "~/trpc/server";
import { auth } from "~/server/auth";
import { RoundedCurrency } from "~/components/ui/number";

export default async function NetWorthPage() {
  const data = await api.netWorthOverview.get();
  const session = await auth();

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
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto w-full max-w-screen-md p-5">
        <p className="text-3xl font-medium">Hey, {session?.user.name}</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <Card className="flex-grow">
            <CardHeader>
              <CardDescription>Net worth</CardDescription>
              <CardTitle className="text-xl font-medium">
                <RoundedCurrency value={data?.netValue} />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="flex-grow">
            <CardHeader>
              <CardDescription>Assets</CardDescription>
              <CardTitle className="text-xl font-medium">
                <RoundedCurrency value={data?.totalAssets} />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="flex-grow">
            <CardHeader>
              <CardDescription>Debts</CardDescription>
              <CardTitle className="text-xl font-medium">
                <RoundedCurrency value={data?.totalDebts} />
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </>
  );
}
