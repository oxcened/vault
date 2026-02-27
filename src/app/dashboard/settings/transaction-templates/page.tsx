"use client";

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
import { TableSkeleton } from "~/components/table-skeleton";
import { DataTable } from "~/components/ui/data-table";
import { getCoreRowModel } from "@tanstack/react-table";
import { transactionTemplateColumns } from "./config";
import { DataTableColumns } from "~/components/ui/data-table-columns";
import { useTable } from "~/hooks/useTable";

export default function TransactionTemplatesPage() {
  const { data = [], isPending } = api.transactionTemplate.getAll.useQuery();

  const table = useTable({
    data,
    columns: transactionTemplateColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      id: "transactionTemplates",
    },
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Transaction templates</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-screen-lg flex-col gap-2 p-5">
        <div className="flex justify-end gap-2">
          <DataTableColumns table={table} />
        </div>

        {isPending ? <TableSkeleton /> : <DataTable table={table} />}
      </div>
    </>
  );
}
