"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export type NavMainProps = {
  primaryItems: NavItem[];
};

function isCurrentPath(pathname: string, url: string) {
  if (url === "/dashboard") return pathname === url;
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function NavMain({ primaryItems }: NavMainProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };
  const activePrimaryUrl = primaryItems
    .filter((item) => isCurrentPath(pathname, item.url))
    .sort((a, b) => b.url.length - a.url.length)[0]?.url;

  return (
    <SidebarGroup className="p-0 pb-4">
      <SidebarGroupLabel className="mb-1 h-7 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/35">
        Workspace
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {primaryItems.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={item.url === activePrimaryUrl}
              asChild
              className="relative h-10 rounded-xl px-3 text-sidebar-foreground/65 transition-all duration-200 before:absolute before:left-0 before:h-4 before:w-0.5 before:scale-y-0 before:rounded-full before:bg-blue-500 before:transition-transform hover:bg-sidebar-accent/70 hover:text-sidebar-foreground data-[active=true]:bg-blue-500/10 data-[active=true]:font-medium data-[active=true]:text-blue-600 data-[active=true]:before:scale-y-100 dark:data-[active=true]:text-blue-400"
            >
              <Link href={item.url} onClick={handleNavigate}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
