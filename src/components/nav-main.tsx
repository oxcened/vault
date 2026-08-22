"use client";

import { type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { SidebarNavLink } from "~/components/sidebar-nav-link";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from "~/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  iconClassName: string;
  activeClassName: string;
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
          <SidebarNavLink
            key={item.url}
            title={item.title}
            href={item.url}
            icon={item.icon}
            isActive={item.url === activePrimaryUrl}
            iconClassName={item.iconClassName}
            activeClassName={item.activeClassName}
            onNavigate={handleNavigate}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
