"use client";

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
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { formatCurrency } from "~/utils/currency";

export default function NetWorthPage() {
  const { data, isPending } = api.netWorthOverview.get.useQuery();

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
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <p className="mx-5 mt-5 text-3xl font-medium">Hey, Alen</p>

      <div className="grid gap-5 p-5 sm:grid-cols-3">
        {isPending ? (
          <>
            <Skeleton className="h-[92px] flex-grow" />
            <Skeleton className="h-[92px] flex-grow" />
            <Skeleton className="h-[92px] flex-grow" />
          </>
        ) : (
          <>
            <Card className="flex-grow">
              <CardHeader>
                <CardTitle>
                  {formatCurrency({ value: data?.netValue ?? 0 })}
                </CardTitle>
                <CardDescription>Net Worth</CardDescription>
              </CardHeader>
            </Card>

            <Card className="flex-grow">
              <CardHeader>
                <CardTitle>
                  {formatCurrency({
                    value: data?.totalAssets ?? 0,
                  })}
                </CardTitle>
                <CardDescription>Assets</CardDescription>
              </CardHeader>
            </Card>

            <Card className="flex-grow">
              <CardHeader>
                <CardTitle>
                  {formatCurrency({ value: data?.totalDebts ?? 0 })}
                </CardTitle>
                <CardDescription>Debts</CardDescription>
              </CardHeader>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
