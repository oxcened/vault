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
  SettingsIcon,
  TrendingUp,
  Vault,
  Wallet,
  WalletCards,
  Zap,
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
      iconClassName: "text-blue-500",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground data-[active=true]:before:bg-blue-500",
    },
    {
      title: "Cash flow",
      url: "/dashboard/cash-flow",
      icon: ArrowLeftRight,
      iconClassName: "text-emerald-500",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground data-[active=true]:before:bg-emerald-500",
    },
    {
      title: "Transactions",
      url: "/dashboard/cash-flow/transactions",
      icon: ReceiptText,
      iconClassName: "text-violet-500",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground data-[active=true]:before:bg-violet-500",
    },
    {
      title: "Reserves",
      url: "/dashboard/cash-flow/envelopes",
      icon: WalletCards,
      iconClassName: "text-amber-500",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground data-[active=true]:before:bg-amber-500",
    },
    {
      title: "Net worth",
      url: "/dashboard/net-worth",
      icon: Wallet,
      iconClassName: "text-indigo-500",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground data-[active=true]:before:bg-indigo-500",
    },
    {
      title: "Assets",
      url: "/dashboard/net-worth/assets",
      icon: TrendingUp,
      iconClassName: "text-teal-500",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground data-[active=true]:before:bg-teal-500",
    },
    {
      title: "Debts",
      url: "/dashboard/net-worth/debts",
      icon: CreditCard,
      iconClassName: "text-rose-500",
      activeClassName:
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground data-[active=true]:before:bg-rose-500",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const settingsIsActive =
    pathname.startsWith("/dashboard/settings") ||
    pathname.startsWith("/dashboard/market-data");
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
          className="h-12 rounded-xl px-2 hover:bg-sidebar-accent/60 data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:rounded-lg"
        >
          <Link href="/dashboard">
            <div className="relative flex aspect-square size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_8px_24px_-10px_rgba(59,130,246,0.9)] group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:shadow-none">
              <Vault className="size-[18px]" strokeWidth={2.2} />
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-[15px] font-semibold tracking-tight">
                Vault
              </span>
              <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-sidebar-foreground/50">
                <Zap className="size-2.5 fill-current" /> Personal finance
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
            title="Settings"
            href="/dashboard/settings"
            icon={SettingsIcon}
            isActive={settingsIsActive}
            iconClassName="text-slate-300"
            activeClassName="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground data-[active=true]:before:bg-slate-400"
            onNavigate={() => isMobile && setOpenMobile(false)}
          />
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
