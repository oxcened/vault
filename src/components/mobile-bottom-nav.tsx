"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CreditCard,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Settings,
  TrendingUp,
  Wallet,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

type MobileNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

const items: MobileNavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/dashboard",
  },
  {
    title: "Cash flow",
    href: "/dashboard/cash-flow",
    icon: ArrowLeftRight,
    isActive: (pathname) => pathname === "/dashboard/cash-flow",
  },
  {
    title: "Transactions",
    href: "/dashboard/cash-flow/transactions",
    icon: ReceiptText,
    isActive: (pathname) =>
      pathname.startsWith("/dashboard/cash-flow/transactions"),
  },
  {
    title: "Net worth",
    href: "/dashboard/net-worth",
    icon: Wallet,
    isActive: (pathname) => pathname === "/dashboard/net-worth",
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const moreIsActive =
    pathname.startsWith("/dashboard/cash-flow/envelopes") ||
    pathname.startsWith("/dashboard/net-worth/assets") ||
    pathname.startsWith("/dashboard/net-worth/debts") ||
    pathname.startsWith("/dashboard/settings") ||
    pathname.startsWith("/dashboard/market-data");

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 px-2 pt-1.5 shadow-[0_-8px_30px_-18px_rgba(0,0,0,0.45)] backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors",
                active && "text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-10 items-center justify-center rounded-full transition-colors",
                  active && "bg-blue-500/10 text-blue-500",
                )}
              >
                <item.icon className="size-[17px]" />
              </span>
              <span className="w-full truncate text-center">{item.title}</span>
            </Link>
          );
        })}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors",
                moreIsActive && "text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-10 items-center justify-center rounded-full transition-colors",
                  moreIsActive && "bg-blue-500/10 text-blue-500",
                )}
              >
                <Menu className="size-[17px]" />
              </span>
              <span>More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            sideOffset={10}
            className="min-w-48 rounded-xl p-1.5"
          >
            {[
              {
                title: "Reserves",
                href: "/dashboard/cash-flow/envelopes",
                icon: WalletCards,
              },
              {
                title: "Assets",
                href: "/dashboard/net-worth/assets",
                icon: TrendingUp,
              },
              {
                title: "Debts",
                href: "/dashboard/net-worth/debts",
                icon: CreditCard,
              },
              {
                title: "Settings",
                href: "/dashboard/settings",
                icon: Settings,
              },
            ].map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className="gap-2.5 rounded-lg py-2.5">
                  <item.icon className="size-4 text-muted-foreground" />
                  {item.title}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
