"use client";

import { ArrowDownUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { RoundedCurrency } from "~/components/ui/number";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { format } from "date-fns";
import { FinancialSparkline } from "./financial-sparkline";

export function CashFlowCard() {
  const { data } = api.dashboard.getSummary.useQuery();

  if (!data) return null;
  const netFlow = data.cashFlow?.netFlow;
  const income = data.cashFlow?.income.toNumber() ?? 0;
  const expenses = data.cashFlow?.expenses.toNumber() ?? 0;
  const totalFlow = Math.abs(income) + Math.abs(expenses);
  const incomeShare = totalFlow > 0 ? (Math.abs(income) / totalFlow) * 100 : 50;

  return (
    <Link href="/dashboard/cash-flow" className="group block">
      <Card className="relative h-full overflow-hidden bg-gradient-to-br from-card via-card to-emerald-500/[0.06] transition-colors group-hover:border-emerald-500/30">
        <div className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-emerald-500/10 blur-3xl" />
        <CardHeader className="relative flex-row items-center justify-between space-y-0 p-5 pb-0">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/15">
              <ArrowDownUp className="size-4" />
            </span>
            <CardDescription className="font-medium text-foreground">
              Cash flow
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <FinancialSparkline
              data={data.cashFlowHistory?.map((item) => ({
                timestamp: item.timestamp,
                value: item.netFlow,
              }))}
              label="cash-flow"
            />
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardHeader>

        <CardContent className="relative p-5 pt-4">
          <CardTitle
            className={cn(
              "text-3xl tracking-tight",
              netFlow?.gt(0) && "text-financial-positive",
              netFlow?.lt(0) && "text-financial-negative",
            )}
          >
            <RoundedCurrency value={netFlow} />
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.cashFlowHasActivity
              ? `Through ${format(new Date(), "d MMM yyyy")}`
              : "No activity yet this month"}
          </p>

          <div
            className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-muted"
            aria-hidden="true"
          >
            {totalFlow > 0 ? (
              <>
                <span
                  className="bg-emerald-500"
                  style={{ width: `${incomeShare}%` }}
                />
                <span className="flex-1 bg-rose-500/70" />
              </>
            ) : (
              <span className="w-full bg-muted-foreground/15" />
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-background/60 p-3 ring-1 ring-inset ring-border/70">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Income
              </div>
              <p className="mt-1 text-sm font-medium text-financial-positive">
                <RoundedCurrency value={data.cashFlow?.income} />
              </p>
            </div>
            <div className="rounded-lg bg-background/60 p-3 ring-1 ring-inset ring-border/70">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-rose-500" />
                Expenses
              </div>
              <p className="mt-1 text-sm font-medium text-financial-negative">
                <RoundedCurrency value={data.cashFlow?.expenses} />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
