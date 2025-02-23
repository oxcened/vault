import * as React from "react";

import { SearchForm } from "~/components/search-form";
import { VersionSwitcher } from "~/components/version-switcher";
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
} from "~/components/ui/sidebar";

// This is sample data.
const data = {
  versions: ["2025"],
  navMain: [
    {
      title: "Net Worth",
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
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        <SearchForm />
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
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
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
