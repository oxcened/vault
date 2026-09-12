"use client";

import { format } from "date-fns";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { api } from "~/trpc/react";

export default function IosShortcutsSettingsPage() {
  const { data: tokens = [], isPending } =
    api.shortcutApiToken.getAll.useQuery();
  const utils = api.useUtils();
  const { confirm, modal } = useConfirmDelete();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("iPhone Shortcut");
  const [newToken, setNewToken] = useState<string | null>(null);

  const create = api.shortcutApiToken.create.useMutation({
    onSuccess: ({ token }) => {
      setNewToken(token);
      setCreateOpen(false);
      void utils.shortcutApiToken.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = api.shortcutApiToken.delete.useMutation({
    onSuccess: () => {
      toast.success("Shortcut token revoked.");
      void utils.shortcutApiToken.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const copyToken = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    toast.success("Token copied.");
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DashboardBreadcrumb
          items={[
            { label: "Settings", href: "/dashboard/settings" },
            { label: "iOS Shortcuts" },
          ]}
        />
      </header>

      <main className="mx-auto flex w-full max-w-screen-lg flex-col gap-5 p-5 md:py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            iOS Shortcuts
          </h1>
          <p className="text-sm text-muted-foreground">
            Create tokens that let your personal Shortcuts add expense
            transactions to Vault.
          </p>
        </div>

        <section className="rounded-2xl border bg-gradient-to-br from-blue-500/[0.07] via-card to-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-inset ring-blue-500/20">
                <KeyRound className="size-5" />
              </span>
              <h2 className="font-semibold">Expense import tokens</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Tokens are tied to your account and can be revoked at any time.
              </p>
            </div>
            <Button
              className="h-11 sm:px-5"
              onClick={() => setCreateOpen(true)}
            >
              <Plus /> Create token
            </Button>
          </div>
        </section>

        <section>
          <div className="mb-3 px-1">
            <h2 className="font-semibold">Active tokens</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {tokens.length} {tokens.length === 1 ? "token" : "tokens"}
            </p>
          </div>
          {isPending ? (
            <div className="h-24 animate-pulse rounded-xl border bg-muted/30" />
          ) : tokens.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No iOS Shortcut tokens yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center gap-3 border-b p-4 last:border-b-0"
                >
                  <KeyRound className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{token.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Created {format(token.createdAt, "d MMM yyyy")} ·{" "}
                      {token.lastUsedAt
                        ? `last used ${format(token.lastUsedAt, "d MMM yyyy")}`
                        : "not used yet"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Revoke ${token.name}`}
                    onClick={() =>
                      confirm({
                        itemType: "Shortcut token",
                        itemName: token.name,
                        onConfirm: () => remove.mutate({ id: token.id }),
                      })
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create iOS Shortcut token</DialogTitle>
            <DialogDescription>
              Give this token a recognizable name, such as your iPhone or a
              specific Shortcut.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="shortcut-token-name">Name</Label>
            <Input
              id="shortcut-token-name"
              value={name}
              maxLength={64}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && name.trim()) {
                  create.mutate({ name: name.trim() });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={!name.trim() || create.isPending}
              onClick={() => create.mutate({ name: name.trim() })}
            >
              Create token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(newToken)} onOpenChange={() => setNewToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save your token now</DialogTitle>
            <DialogDescription>
              Vault will not show this token again. Copy it into the
              Authorization header of your iOS Shortcut.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              readOnly
              value={newToken ?? ""}
              className="font-mono text-xs"
            />
            <Button variant="outline" size="icon" onClick={copyToken}>
              <Copy className="size-4" />
              <span className="sr-only">Copy token</span>
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewToken(null)}>I saved it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {modal}
    </>
  );
}
