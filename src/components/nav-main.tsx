"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "~/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

type NavCollection = {
  title: string;
  icon: LucideIcon;
  items: Omit<NavItem, "icon">[];
};

export type NavMainProps = {
  primaryItems: NavItem[];
  collections: NavCollection[];
};

function isCurrentPath(pathname: string, url: string) {
  if (url === "/dashboard") return pathname === url;
  return pathname === url || pathname.startsWith(`${url}/`);
}

function NavCollection({
  collection,
  pathname,
  onNavigate,
}: {
  collection: NavCollection;
  pathname: string;
  onNavigate: () => void;
}) {
  const collectionIsActive = collection.items.some((item) =>
    isCurrentPath(pathname, item.url),
  );
  const [open, setOpen] = React.useState(collectionIsActive);

  React.useEffect(() => {
    if (collectionIsActive) setOpen(true);
  }, [collectionIsActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={collection.title}
            isActive={collectionIsActive}
            className="group/collection"
          >
            <collection.icon />
            <span>{collection.title}</span>
            <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collection:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mb-1 mt-1">
            {collection.items.map((item) => (
              <SidebarMenuSubItem key={item.url}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isCurrentPath(pathname, item.url)}
                >
                  <Link href={item.url} onClick={onNavigate}>
                    {item.title}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function NavMain({ primaryItems, collections }: NavMainProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };
  const activePrimaryUrl = primaryItems
    .filter((item) => isCurrentPath(pathname, item.url))
    .sort((a, b) => b.url.length - a.url.length)[0]?.url;

  return (
    <>
      <SidebarGroup className="pb-2">
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarMenu>
          {primaryItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={item.url === activePrimaryUrl}
                asChild
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

      <SidebarGroup className="pt-2">
        <SidebarGroupLabel>More</SidebarGroupLabel>
        <SidebarMenu>
          {collections.map((collection) => (
            <NavCollection
              key={collection.title}
              collection={collection}
              pathname={pathname}
              onNavigate={handleNavigate}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
