"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { LogOut } from "lucide-react";

import { ModeToggle } from "~/components/mode-toggle";
import { PrivacyToggle } from "~/components/privacy-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function MobileUserMenu() {
  const { data: session } = useSession();
  const name = session?.user.name ?? "Account";
  const email = session?.user.email ?? "";
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="absolute right-3 top-3 z-30 md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open account menu"
            className="rounded-xl outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Avatar className="size-10 rounded-xl border bg-background shadow-sm">
              <AvatarImage src={session?.user.image ?? ""} alt={name} />
              <AvatarFallback className="rounded-xl bg-muted text-xs font-semibold">
                {initials || "V"}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="end"
          sideOffset={8}
          className="min-w-64 rounded-xl p-1.5"
        >
          <DropdownMenuLabel className="p-2 font-normal">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-9 rounded-lg">
                <AvatarImage src={session?.user.image ?? ""} alt={name} />
                <AvatarFallback className="rounded-lg text-xs font-semibold">
                  {initials || "V"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-medium">{name}</p>
                {email && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {email}
                  </p>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <PrivacyToggle />
          <ModeToggle />
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/api/auth/signout" className="gap-2.5 rounded-lg">
              <LogOut className="size-4 text-muted-foreground" />
              Log out
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
