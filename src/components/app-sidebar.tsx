"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  CreditCard,
  Database,
  LayoutDashboard,
  ReceiptText,
  SettingsIcon,
  TrendingUp,
  Vault,
  Wallet,
  WalletCards,
} from "lucide-react";

import { NavMain } from "~/components/nav-main";
import { NavUser } from "~/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "~/components/ui/sidebar";

const navigation = {
  primary: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Cash flow",
      url: "/dashboard/cash-flow",
      icon: ArrowLeftRight,
    },
    {
      title: "Transactions",
      url: "/dashboard/cash-flow/transactions",
      icon: ReceiptText,
    },
    {
      title: "Reserves",
      url: "/dashboard/cash-flow/envelopes",
      icon: WalletCards,
    },
    {
      title: "Net worth",
      url: "/dashboard/net-worth",
      icon: Wallet,
    },
    {
      title: "Assets",
      url: "/dashboard/net-worth/assets",
      icon: TrendingUp,
    },
    {
      title: "Debts",
      url: "/dashboard/net-worth/debts",
      icon: CreditCard,
    },
  ],
  collections: [
    {
      title: "Insights",
      icon: ChartNoAxesCombined,
      items: [
        {
          title: "Assets",
          url: "/dashboard/performance/assets-history",
        },
        {
          title: "Debts",
          url: "/dashboard/performance/debts-history",
        },
        {
          title: "Transaction categories",
          url: "/dashboard/performance/transaction-categories-history",
        },
      ],
    },
    {
      title: "Market data",
      icon: Database,
      items: [
        {
          title: "Exchange rates",
          url: "/dashboard/market-data/exchange-rates",
        },
        {
          title: "Stock prices",
          url: "/dashboard/market-data/stock-prices",
        },
      ],
    },
    {
      title: "Settings",
      icon: SettingsIcon,
      items: [
        {
          title: "Transaction presets",
          url: "/dashboard/settings/transaction-templates",
        },
        {
          title: "Transaction categories",
          url: "/dashboard/settings/transaction-categories",
        },
        {
          title: "Net worth categories",
          url: "/dashboard/settings/net-worth-categories",
        },
        {
          title: "Stock tickers",
          url: "/dashboard/settings/stock-tickers",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const user: React.ComponentProps<typeof NavUser>["user"] = {
    avatar: session?.user.image ?? "",
    email: session?.user.email ?? "john.doe@example.com",
    name: session?.user.name ?? "John Doe",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <SidebarMenuButton asChild size="lg" className="h-11">
          <Link href="/dashboard">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <Vault className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Vault</span>
              <span className="truncate text-xs text-muted-foreground">
                Personal finance
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <NavMain
          primaryItems={navigation.primary}
          collections={navigation.collections}
        />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
