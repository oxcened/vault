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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
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
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
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
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              isActive={
                pathname.startsWith("/dashboard/settings") ||
                pathname.startsWith("/dashboard/market-data")
              }
              className="h-10 rounded-xl px-3 text-sidebar-foreground/65 transition-all hover:bg-sidebar-accent/70 hover:text-sidebar-foreground data-[active=true]:bg-blue-500/10 data-[active=true]:font-medium data-[active=true]:text-blue-600 dark:data-[active=true]:text-blue-400"
            >
              <Link
                href="/dashboard/settings"
                onClick={() => isMobile && setOpenMobile(false)}
              >
                <SettingsIcon />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
