"use client";

import { ArrowRight, EyeClosed, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { usePrivacy } from "~/components/privacy";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";

const ENTRY_GATE_STORAGE_KEY = "vaultEntryGateSeen";

type DashboardEntryGateProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    image: string;
  };
};

export function DashboardEntryGate({
  children,
  user,
}: DashboardEntryGateProps) {
  const { mode, setMode } = usePrivacy();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    try {
      setIsOpen(window.sessionStorage.getItem(ENTRY_GATE_STORAGE_KEY) !== "1");
    } catch {
      // Keep the gate open when session storage is unavailable.
    }
  }, []);

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function continueToDashboard() {
    try {
      window.sessionStorage.setItem(ENTRY_GATE_STORAGE_KEY, "1");
    } catch {
      // The gate will remain available on the next load if storage is blocked.
    }
    setIsOpen(false);
  }

  return (
    <>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 grid min-h-dvh place-items-center overflow-y-auto bg-background/95 px-4 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="entry-gate-title"
        >
          <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl shadow-black/10 sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                  <ShieldCheck className="size-4" />
                </div>
                Vault
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Private by default
              </span>
            </div>

            <div className="mb-7">
              <h1
                id="entry-gate-title"
                className="text-2xl font-semibold tracking-tight"
              >
                Welcome back, {user.name.split(" ")[0]}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Choose your privacy settings before entering your dashboard.
              </p>
            </div>

            <div className="mb-5 flex items-center gap-3 rounded-2xl border bg-muted/35 p-3">
              <Avatar className="size-11 rounded-xl">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="rounded-xl bg-blue-500/10 font-semibold text-blue-600 dark:text-blue-300">
                  {initials || "V"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <Link
                href="/api/auth/signout"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </Link>
            </div>

            <div className="mb-7 flex items-center gap-3 rounded-2xl border p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <EyeClosed className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="entry-hide-amounts"
                  className="text-sm font-medium"
                >
                  Hide amounts
                </label>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  Blur balances and values across Vault.
                </p>
              </div>
              <Switch
                id="entry-hide-amounts"
                checked={mode !== "off"}
                onCheckedChange={(checked) => setMode(checked ? "blur" : "off")}
                aria-label="Hide amounts"
              />
            </div>

            <Button
              className="h-11 w-full rounded-xl"
              onClick={continueToDashboard}
            >
              Continue to Vault
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
