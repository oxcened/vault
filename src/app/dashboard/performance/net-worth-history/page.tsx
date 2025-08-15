"use client";

import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { api } from "~/trpc/react";
import { netWorthColumns } from "./config";
import { TableSkeleton } from "~/components/table-skeleton";
import { DataTable } from "~/components/ui/data-table";
import { DataTableColumns } from "~/components/ui/data-table-columns";

export default function NwHistoryPage() {
  const { data = [], isPending } = api.netWorth.getAll.useQuery();

  const table = useReactTable({
    data,
    columns: netWorthColumns,
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
              <BreadcrumbPage>Net worth history</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-2 p-5">
        <DataTableColumns table={table} className="self-end" />

        {isPending ? <TableSkeleton /> : <DataTable table={table} />}
      </div>
    </>
  );
}
