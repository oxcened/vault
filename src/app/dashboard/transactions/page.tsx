"use client";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { TransactionTable } from "~/components/transactionTable/transaction-table";
import type Decimal from "decimal.js";
import { type TransactionType } from "@prisma/client";

export type Transaction = {
  id: string;
  amount: Decimal;
  currency: string;
  timestamp: Date;
  description: string;
  type: TransactionType;
  categoryId: string;
  category: {
    name: string;
  };
};

export default function TransactionsPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DashboardBreadcrumb items={[{ label: "Transactions" }]} />
      </header>

      <div className="mx-auto flex w-screen max-w-screen-lg flex-col gap-2 p-5">
        <TransactionTable />
      </div>
    </>
  );
}
