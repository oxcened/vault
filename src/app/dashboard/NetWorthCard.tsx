"use client";

import { ChevronRight, WalletCards } from "lucide-react";
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
import { format } from "date-fns";
import { FinancialSparkline } from "./financial-sparkline";

export function NetWorthCard() {
  const { data } = api.dashboard.getSummary.useQuery();

  if (!data) return null;

  const assets = data.netWorth?.totalAssets.toNumber() ?? 0;
  const debts = data.netWorth?.totalDebts.toNumber() ?? 0;
  const total = Math.abs(assets) + Math.abs(debts);
  const assetShare = total > 0 ? (Math.abs(assets) / total) * 100 : 50;

  return (
    <Link href="/dashboard/net-worth" className="group block">
      <Card className="relative h-full overflow-hidden bg-gradient-to-br from-card via-card to-blue-500/[0.06] transition-colors group-hover:border-blue-500/30">
        <div className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-blue-500/10 blur-3xl" />
        <CardHeader className="relative flex-row items-center justify-between space-y-0 p-5 pb-0">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 ring-1 ring-inset ring-blue-500/15">
              <WalletCards className="size-4" />
            </span>
            <CardDescription className="font-medium text-foreground">
              Net worth
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <FinancialSparkline data={data.netWorthHistory} label="net-worth" />
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardHeader>

        <CardContent className="relative p-5 pt-4">
          <CardTitle className="text-3xl tracking-tight">
            <RoundedCurrency value={data.netWorth?.netValue} />
          </CardTitle>
          {data.netWorth?.timestamp && (
            <p className="mt-1 text-xs text-muted-foreground">
              As of {format(data.netWorth.timestamp, "d MMM yyyy")}
            </p>
          )}

          <div
            className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-muted"
            aria-hidden="true"
          >
            <span className="bg-blue-500" style={{ width: `${assetShare}%` }} />
            <span className="flex-1 bg-rose-500/70" />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-background/60 p-3 ring-1 ring-inset ring-border/70">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-blue-500" />
                Assets
              </div>
              <p className="mt-1 text-sm font-medium">
                <RoundedCurrency value={data.netWorth?.totalAssets} />
              </p>
            </div>
            <div className="rounded-lg bg-background/60 p-3 ring-1 ring-inset ring-border/70">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-rose-500" />
                Debts
              </div>
              <p className="mt-1 text-sm font-medium">
                <RoundedCurrency value={data.netWorth?.totalDebts} />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
