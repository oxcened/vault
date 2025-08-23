"use client";

import * as React from "react";
import {
  ArrowLeftRight,
  Frame,
  Globe,
  LayoutDashboard,
  LineChart,
  Map,
  PieChart,
  Settings2Icon,
  SettingsIcon,
  Vault,
  Wallet,
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
import { useSession } from "next-auth/react";
import Link from "next/link";

const data = {
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Net worth",
      url: "#",
      icon: Wallet,
      items: [
        {
          title: "Overview",
          url: "/dashboard/net-worth",
        },
        {
          title: "Assets",
          url: "/dashboard/net-worth/assets",
        },
        {
          title: "Debts",
          url: "/dashboard/net-worth/debts",
        },
      ],
    },
    {
      title: "Cash flow",
      url: "#",
      icon: ArrowLeftRight,
      items: [
        {
          title: "Overview",
          url: "/dashboard/cash-flow",
        },
        {
          title: "Transactions",
          url: "/dashboard/cash-flow/transactions",
        },
      ],
    },
    {
      title: "Performance & History",
      url: "#",
      icon: LineChart,
      items: [
        {
          title: "Net worth history",
          url: "/dashboard/performance/net-worth-history",
        },
        {
          title: "Assets history",
          url: "/dashboard/performance/assets-history",
        },
        {
          title: "Debts history",
          url: "/dashboard/performance/debts-history",
        },
        {
          title: "Cash flow history",
          url: "/dashboard/performance/cash-flow-history",
        },
      ],
    },
    {
      title: "Market data",
      url: "#",
      icon: Globe,
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
      url: "#",
      icon: SettingsIcon,
      items: [
        {
          title: "Transaction templates",
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
      <SidebarHeader>
        <Link href="/dashboard">
          <SidebarMenuButton
            asChild
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Vault className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Vault</span>
              </div>
            </div>
          </SidebarMenuButton>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
