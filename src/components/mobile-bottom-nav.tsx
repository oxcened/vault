"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CreditCard,
  LayoutDashboard,
  Menu,
  ReceiptText,
  RefreshCw,
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
  activeClassName: string;
};

const items: MobileNavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/dashboard",
    activeClassName: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Cash flow",
    href: "/dashboard/cash-flow",
    icon: ArrowLeftRight,
    isActive: (pathname) => pathname === "/dashboard/cash-flow",
    activeClassName: "bg-emerald-500/10 text-emerald-500",
  },
  {
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: ReceiptText,
    isActive: (pathname) => pathname.startsWith("/dashboard/transactions"),
    activeClassName: "bg-violet-500/10 text-violet-500",
  },
  {
    title: "Net worth",
    href: "/dashboard/net-worth",
    icon: Wallet,
    isActive: (pathname) => pathname === "/dashboard/net-worth",
    activeClassName: "bg-indigo-500/10 text-indigo-500",
  },
];

function getMoreActiveClassName(pathname: string) {
  if (pathname.startsWith("/dashboard/reserves")) {
    return "bg-amber-500/10 text-amber-500";
  }
  if (pathname.startsWith("/dashboard/assets")) {
    return "bg-teal-500/10 text-teal-500";
  }
  if (pathname.startsWith("/dashboard/debts")) {
    return "bg-rose-500/10 text-rose-500";
  }
  if (pathname.startsWith("/dashboard/settings")) {
    return "bg-slate-400/10 text-slate-300";
  }
  return "bg-blue-500/10 text-blue-500";
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const moreIsActive =
    pathname.startsWith("/dashboard/reserves") ||
    pathname.startsWith("/dashboard/monthly-update") ||
    pathname.startsWith("/dashboard/assets") ||
    pathname.startsWith("/dashboard/debts") ||
    pathname.startsWith("/dashboard/settings");

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
                  active && item.activeClassName,
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
                  moreIsActive && getMoreActiveClassName(pathname),
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
                title: "Monthly update",
                href: "/dashboard/monthly-update",
                icon: RefreshCw,
              },
              {
                title: "Reserves",
                href: "/dashboard/reserves",
                icon: WalletCards,
              },
              {
                title: "Assets",
                href: "/dashboard/assets",
                icon: TrendingUp,
              },
              {
                title: "Debts",
                href: "/dashboard/debts",
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
