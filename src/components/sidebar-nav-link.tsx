import Link from "next/link";
import { type LucideIcon } from "lucide-react";

import { SidebarMenuButton, SidebarMenuItem } from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";

export type SidebarNavLinkProps = {
  title: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  iconClassName: string;
  activeClassName: string;
  onNavigate?: () => void;
};

export function SidebarNavLink({
  title,
  href,
  icon: Icon,
  isActive,
  iconClassName,
  activeClassName,
  onNavigate,
}: SidebarNavLinkProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={title}
        isActive={isActive}
        asChild
        className={cn(
          "relative h-10 rounded-xl px-2.5 text-sidebar-foreground/65 transition-all duration-200 before:absolute before:left-0 before:h-4 before:w-0.5 before:scale-y-0 before:rounded-full before:transition-transform hover:bg-sidebar-accent/70 hover:text-sidebar-foreground data-[active=true]:font-medium data-[active=true]:before:scale-y-100 group-data-[collapsible=icon]:!p-0",
          activeClassName,
        )}
      >
        <Link href={href} onClick={onNavigate}>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg bg-transparent text-sidebar-foreground/50 transition-colors group-data-[collapsible=icon]:size-8 [&>svg]:size-4",
              isActive && iconClassName,
            )}
          >
            <Icon />
          </span>
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
