"use client";

import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import { TableSkeleton } from "~/components/table-skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { DataTable } from "~/components/ui/data-table";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { api } from "~/trpc/react";
import { cashFlowColumns } from "./config";

export default function CashFlowHistoryPage() {
  const { data, isPending } = api.cashFlow.getAll.useQuery();

  const table = useReactTable({
    data: data ?? [],
    columns: cashFlowColumns,
    getCoreRowModel: getCoreRowModel(),
  });

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
        {isPending ? <TableSkeleton /> : <DataTable table={table} />}
      </div>
    </>
  );
}
