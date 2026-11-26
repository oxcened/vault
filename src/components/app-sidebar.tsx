"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  RefreshCw,
  SettingsIcon,
  TrendingUp,
  Vault,
  Wallet,
  WalletCards,
} from "lucide-react";

import { NavMain } from "~/components/nav-main";
import { NavUser } from "~/components/nav-user";
import { SidebarNavLink } from "~/components/sidebar-nav-link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "~/components/ui/sidebar";

const navigation = {
  primary: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: LayoutDashboard,
      iconClassName: "text-sidebar-foreground",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
    },
    {
      title: "Cash flow",
      url: "/dashboard/cash-flow",
      icon: ArrowLeftRight,
      iconClassName: "text-sidebar-foreground",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
    },
    {
      title: "Transactions",
      url: "/dashboard/transactions",
      icon: ReceiptText,
      iconClassName: "text-sidebar-foreground",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
    },
    {
      title: "Reserves",
      url: "/dashboard/reserves",
      icon: WalletCards,
      iconClassName: "text-sidebar-foreground",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
    },
    {
      title: "Net worth",
      url: "/dashboard/net-worth",
      icon: Wallet,
      iconClassName: "text-sidebar-foreground",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
    },
    {
      title: "Assets",
      url: "/dashboard/assets",
      icon: TrendingUp,
      iconClassName: "text-sidebar-foreground",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
    },
    {
      title: "Debts",
      url: "/dashboard/debts",
      icon: CreditCard,
      iconClassName: "text-sidebar-foreground",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const settingsIsActive = pathname.startsWith("/dashboard/settings");
  const monthlyUpdateIsActive = pathname.startsWith(
    "/dashboard/monthly-update",
  );
  const user: React.ComponentProps<typeof NavUser>["user"] = {
    avatar: session?.user.image ?? "",
    email: session?.user.email ?? "john.doe@example.com",
    name: session?.user.name ?? "John Doe",
  };

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border/70" {...props}>
      <SidebarHeader className="px-3 pb-4 pt-4 group-data-[collapsible=icon]:px-2">
        <SidebarMenuButton
          asChild
          size="lg"
          className="h-12 rounded-md px-2 hover:bg-sidebar-accent/60 data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:rounded-md"
        >
          <Link href="/dashboard">
            <div className="relative flex aspect-square size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-sidebar-border bg-sidebar-accent text-sidebar-foreground group-data-[collapsible=icon]:size-8">
              <Vault className="size-[18px]" strokeWidth={2.2} />
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-[15px] font-semibold tracking-tight">
                Vault
              </span>
              <span className="mt-0.5 truncate text-[11px] text-sidebar-foreground/50">
                Personal finance
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent className="px-2 pb-3">
        <NavMain primaryItems={navigation.primary} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70 p-3">
        <SidebarMenu>
          <SidebarNavLink
            title="Monthly update"
            href="/dashboard/monthly-update"
            icon={RefreshCw}
            isActive={monthlyUpdateIsActive}
            iconClassName="text-sidebar-foreground"
            activeClassName="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
            onNavigate={() => isMobile && setOpenMobile(false)}
          />
          <SidebarNavLink
            title="Settings"
            href="/dashboard/settings"
            icon={SettingsIcon}
            isActive={settingsIsActive}
            iconClassName="text-sidebar-foreground"
            activeClassName="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
            onNavigate={() => isMobile && setOpenMobile(false)}
          />
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
