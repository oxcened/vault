"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "~/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import { Button, buttonVariants } from "./ui/button";
import { LogOut } from "lucide-react";

const data = {
  navMain: [
    {
      title: "Net worth",
      url: "#",
      items: [
        {
          title: "Overview",
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
        {
          title: "History",
          url: "/dashboard/nw-history",
        },
      ],
    },
    {
      title: "Cash flow",
      url: "#",
      items: [
        {
          title: "Overview",
          url: "/dashboard/cash-flow",
        },
        {
          title: "Transactions",
          url: "/dashboard/transactions",
        },
      ],
    },
    {
      title: "Other",
      url: "#",
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
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar {...props}>
      <SidebarHeader className="h-16 flex-row items-center">
        <p className="mr-auto p-2 font-medium">Vault</p>
        <ModeToggle />
        <Link
          href="/api/auth/signout"
          className={buttonVariants({
            variant: "outline",
            size: "icon",
          })}
        >
          <LogOut />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link
                        href={item.url}
                        onClick={() => setOpenMobile(false)}
                      >
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
