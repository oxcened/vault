"use client";

import { TransactionCategoryType } from "@prisma/client";
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
import { transactionCategoryColumns } from "./config";
import { useTable } from "~/hooks/useTable";
import { Button } from "~/components/ui/button";
import { ListFilter, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { CategoryDialog } from "./CategoryDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type TypeFilter = TransactionCategoryType | "ALL";

const typeLabels: Record<TypeFilter, string> = {
  ALL: "All types",
  INCOME: "Income",
  EXPENSE: "Expense",
  TRANSFER: "Transfer",
};

export default function TransactionCategoriesPage() {
  const { data, isPending } = api.transactionCategory.getAll.useQuery();
  const [type, setType] = useState<TypeFilter>("ALL");
  const filteredData = useMemo(
    () =>
      type === "ALL"
        ? (data ?? [])
        : (data ?? []).filter((category) => category.type === type),
    [data, type],
  );

  const table = useTable({
    data: filteredData,
    columns: transactionCategoryColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      id: "transactionCategories",
    },
  });
  const [isNewDialogOpen, setNewDialogOpen] = useState(false);

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
              <BreadcrumbPage>Transaction categories</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="mx-auto flex w-full max-w-screen-lg flex-col gap-5 p-5 md:py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Transaction categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize income, expenses, and transfers across your cash flow.
          </p>
        </div>

        <section className="rounded-2xl border bg-gradient-to-br from-blue-500/[0.07] via-card to-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Category type
              </label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as TypeFilter)}
              >
                <SelectTrigger className="h-11 w-full bg-background/70 sm:w-64">
                  <ListFilter className="size-4" />
                  <SelectValue>{typeLabels[type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{typeLabels.ALL}</SelectItem>
                  {Object.values(TransactionCategoryType).map((value) => (
                    <SelectItem key={value} value={value}>
                      {typeLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="h-11 sm:px-5"
              onClick={() => setNewDialogOpen(true)}
            >
              <Plus /> Add category
            </Button>
          </div>
        </section>

        <section>
          <div className="mb-3 px-1">
            <h2 className="font-semibold">Categories</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {filteredData.length}{" "}
              {filteredData.length === 1 ? "category" : "categories"}
              {type === "ALL" ? "" : ` · ${typeLabels[type]}`}
            </p>
          </div>
          {isPending ? <TableSkeleton /> : <DataTable table={table} />}
        </section>
      </main>
      <CategoryDialog
        key={`new-category-${isNewDialogOpen}`}
        isOpen={isNewDialogOpen}
        defaultType={type === "ALL" ? undefined : type}
        onOpenChange={setNewDialogOpen}
      />
    </>
  );
}
