"use client";

import * as React from "react";
import {
  ArrowLeftRight,
  AudioWaveform,
  Command,
  Frame,
  GalleryVerticalEnd,
  Globe,
  LayoutDashboard,
  LineChart,
  Map,
  PieChart,
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
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "#",
      icon: LayoutDashboard,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
        },
      ],
    },
    {
      title: "Net worth",
      url: "#",
      icon: Wallet,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard/net-worth",
        },
        {
          title: "Assets",
          url: "/dashboard/assets",
        },
        {
          title: "Debts",
          url: "/dashboard/debts",
        },
      ],
    },
    {
      title: "Cash flow",
      url: "#",
      icon: ArrowLeftRight,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard/cash-flow",
        },
        {
          title: "Transactions",
          url: "/dashboard/transactions",
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
          url: "/dashboard/nw-history",
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
          url: "/dashboard/exchange-rates",
        },
        {
          title: "Stock prices",
          url: "/dashboard/stock-prices",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
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
