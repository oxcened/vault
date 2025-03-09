"use client";

import * as React from "react";
import {
  AudioWaveform,
  Banknote,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Globe,
  LayoutDashboard,
  LineChart,
  Map,
  PieChart,
  PiggyBank,
  Settings2,
  SquareTerminal,
  Wallet,
} from "lucide-react";

import { NavMain } from "~/components/nav-main";
import { NavProjects } from "~/components/nav-projects";
import { NavUser } from "~/components/nav-user";
import { TeamSwitcher } from "~/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";
import { useSession } from "next-auth/react";

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
      title: "Financial breakdown",
      url: "#",
      icon: Wallet,
      items: [
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
      title: "Performance & History",
      url: "#",
      icon: LineChart,
      items: [
        {
          title: "Net worth history",
          url: "/dashboard/nw-history",
        },
        {
          title: "Cash flow",
          url: "/dashboard/cash-flow",
        },
        {
          title: "Transactions",
          url: "/dashboard/transactions",
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
    avatar: session?.user.image || "",
    email: session?.user.email || "john.doe@example.com",
    name: session?.user.name || "John Doe",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <p className="mr-auto p-2 font-medium">Vault</p>
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
