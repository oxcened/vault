"use client";

import Link from "next/link";
import { format } from "date-fns";
import { RoundedCurrency } from "~/components/ui/number";
import { TransactionIcon } from "~/components/transactionTable/transaction-icon";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { type Prisma } from "@prisma/client";
import { HoldingIcon } from "~/components/holdings/holding-icon";

export function WhatChanged() {
  const { data } = api.dashboard.getSummary.useQuery();
  const holdingChanges = data?.holdingChanges ?? [];
  const cashFlowChanges = data?.cashFlowChanges ?? [];

  if (holdingChanges.length === 0 && cashFlowChanges.length === 0) return null;

  return (
    <section aria-labelledby="what-changed-heading">
      <div className="mb-2">
        <h2 id="what-changed-heading" className="text-sm font-medium">
          What changed
        </h2>
      </div>

      <Card className="grid overflow-hidden shadow-none md:grid-cols-2 md:divide-x">
        {holdingChanges.length > 0 && (
          <div>
            <div className="border-b px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                Biggest net worth drivers
                {data?.previousNetWorthTimestamp && (
                  <span className="font-normal">
                    {" "}
                    · since {format(data.previousNetWorthTimestamp, "d MMM")}
                  </span>
                )}
              </p>
            </div>
            <div className="divide-y">
              {holdingChanges.map((item) => {
                return (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={`/dashboard/${item.kind === "asset" ? "assets" : "debts"}/${item.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <HoldingIcon category={item.category} type={item.kind} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {item.name}
                      </span>
                      <span className="block text-xs capitalize text-muted-foreground">
                        {item.kind}
                      </span>
                    </span>
                    <ChangeAmount value={item.change} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {cashFlowChanges.length > 0 && (
          <div className={cn(holdingChanges.length === 0 && "md:col-span-2")}>
            <div className="border-b px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                This month&apos;s biggest movements
              </p>
            </div>
            <div className="divide-y">
              {cashFlowChanges.map((item) => (
                <Link
                  key={item.id}
                  href="/dashboard/transactions"
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <TransactionIcon category={item.name} type={item.type} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {item.name}
                    </span>
                    <span className="block text-xs capitalize text-muted-foreground">
                      {item.type.toLocaleLowerCase()}
                    </span>
                  </span>
                  <ChangeAmount value={item.amount} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}

function ChangeAmount({ value }: { value: Prisma.Decimal }) {
  return (
    <span
      className={cn(
        "shrink-0 text-sm font-medium",
        value.gt(0) ? "text-financial-positive" : "text-financial-negative",
      )}
    >
      <RoundedCurrency value={value} options={{ signDisplay: "always" }} />
    </span>
  );
}
