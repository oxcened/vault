"use client";

import type { Envelope } from "@prisma/client";
import Decimal from "decimal.js";
import Link from "next/link";
import { useState } from "react";
import {
  Landmark,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { RoundedCurrency } from "~/components/ui/number";
import { Skeleton } from "~/components/ui/skeleton";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import NewEnvelopeDialog from "./NewEnvelopeDialog";
import EditEnvelopeDialog from "./EditEnvelopeDialog";
import { ReserveIcon } from "~/components/reserves/reserve-icon";

function ReserveCard({
  reserve,
  onEdit,
  onDelete,
}: {
  reserve: Envelope;
  onEdit: (reserve: Envelope) => void;
  onDelete: (reserve: Envelope) => void;
}) {
  const allocated = new Decimal(reserve.amount);
  const target = reserve.target ? new Decimal(reserve.target) : null;
  const progress = target?.isPositive()
    ? Math.min(100, allocated.div(target).mul(100).toNumber())
    : 0;
  const progressLabel = Math.round(progress);
  const remaining = target?.minus(allocated);

  return (
    <article className="group rounded-xl border bg-gradient-to-br from-card to-muted/10 p-4 transition-colors hover:border-muted-foreground/30">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-500">
          <ReserveIcon name={reserve.icon} className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{reserve.name}</h2>
          <p className="text-xs text-muted-foreground">
            {target ? `${progressLabel}% funded` : "No target"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-2 size-8">
              <MoreHorizontal />
              <span className="sr-only">Reserve actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(reserve)}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(reserve)}
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <RoundedCurrency value={allocated} className="text-xl font-semibold" />
        {target && (
          <p className="shrink-0 text-right text-xs text-muted-foreground">
            of <RoundedCurrency value={target} className="font-medium" />
          </p>
        )}
      </div>
      {target && (
        <div className="mt-3 space-y-1.5">
          <Progress
            value={progress}
            className="h-1.5 bg-blue-500/15"
            indicatorClassName={cn(
              "bg-blue-500",
              remaining?.lte(0) && "bg-financial-positive",
            )}
          />
          <p
            className={cn(
              "text-[11px] text-muted-foreground",
              remaining?.lte(0) && "text-financial-positive",
            )}
          >
            {remaining?.gt(0) ? (
              <>
                <RoundedCurrency value={remaining} /> still needed
              </>
            ) : (
              "Target covered"
            )}
          </p>
        </div>
      )}
    </article>
  );
}

export default function EnvelopesPage() {
  const utils = api.useUtils();
  const { data, isPending } = api.envelope.getAll.useQuery();
  const [isNewDialogOpen, setNewDialogOpen] = useState(false);
  const [editingReserve, setEditingReserve] = useState<Envelope>();
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const { confirm, modal } = useConfirmDelete();
  const { mutate: deleteReserve } = api.envelope.delete.useMutation({
    onSuccess: () => {
      toast.success("Reserve deleted.");
      void utils.envelope.getAll.invalidate();
    },
  });
  const refresh = () => void utils.envelope.getAll.invalidate();
  const assigned = data?.pool.minus(data.remaining);
  const allocationPercent =
    data?.pool.isPositive() && assigned
      ? Math.min(100, assigned.div(data.pool).mul(100).toNumber())
      : 0;

  function editReserve(reserve: Envelope) {
    setEditingReserve(reserve);
    setEditDialogOpen(true);
  }
  function confirmDelete(reserve: Envelope) {
    confirm({
      itemType: "reserve",
      itemName: reserve.name,
      onConfirm: () => deleteReserve({ id: reserve.id }),
    });
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/cash-flow">
                Cash flow
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Reserves</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main className="mx-auto flex w-full max-w-screen-lg flex-col gap-6 p-5 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reserves</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Give every part of your available cash a purpose.
            </p>
          </div>
          <Button onClick={() => setNewDialogOpen(true)}>
            <Plus />
            <span className="hidden sm:inline">Add reserve</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
        {isPending || !data ? (
          <div className="space-y-5">
            <Skeleton className="h-64 rounded-2xl" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            <section
              className={cn(
                "overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/[0.06] via-card to-card p-5",
                data.remaining.isNegative()
                  ? "border-destructive/30"
                  : "border-primary/20",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Landmark className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    Cash available for reserves
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Across {data.accounts.length} included liquid{" "}
                    {data.accounts.length === 1 ? "account" : "accounts"}
                    {" · "}
                    <Link
                      href="/dashboard/net-worth/assets"
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      Manage
                    </Link>
                  </p>
                </div>
                <RoundedCurrency
                  value={data.pool}
                  className="text-xl font-semibold md:text-2xl"
                />
              </div>
              <div className="mt-5">
                <Progress
                  value={allocationPercent}
                  className="h-1.5 bg-muted"
                  indicatorClassName={
                    data.remaining.isNegative()
                      ? "bg-destructive"
                      : "bg-primary"
                  }
                />
                <div className="mt-4 grid grid-cols-2 divide-x border-t pt-4">
                  <div className="pr-4">
                    <p className="text-xs text-muted-foreground">Reserved</p>
                    <RoundedCurrency
                      value={assigned ?? 0}
                      className="mt-0.5 text-base font-medium"
                    />
                  </div>
                  <div className="pl-4">
                    <p className="text-xs text-muted-foreground">Unallocated</p>
                    <RoundedCurrency
                      value={data.remaining}
                      className={cn(
                        "mt-0.5 text-base font-medium",
                        data.remaining.isPositive() &&
                          "text-financial-positive",
                        data.remaining.isNegative() &&
                          "text-financial-negative",
                      )}
                    />
                  </div>
                </div>
                {data.remaining.isNegative() && (
                  <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    Over-allocated by{" "}
                    <RoundedCurrency value={data.remaining.abs()} />. Reduce a
                    reserve or include another liquid account.
                  </p>
                )}
              </div>
            </section>
            <section>
              <div className="mb-3 flex items-center gap-2">
                <WalletCards className="size-5 text-muted-foreground" />
                <h2 className="font-semibold">Your reserves</h2>
                <span className="text-sm text-muted-foreground">
                  {data.envelopes.length}
                </span>
              </div>
              {data.envelopes.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.envelopes.map((reserve) => (
                    <ReserveCard
                      key={reserve.id}
                      reserve={reserve}
                      onEdit={editReserve}
                      onDelete={confirmDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed p-10 text-center">
                  <WalletCards className="mx-auto size-8 text-muted-foreground" />
                  <h2 className="mt-4 font-medium">No reserves yet</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start with something important, like taxes or an emergency
                    fund.
                  </p>
                  <Button
                    className="mt-5"
                    onClick={() => setNewDialogOpen(true)}
                  >
                    <Plus /> Add reserve
                  </Button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <NewEnvelopeDialog
        key={`new-reserve-${isNewDialogOpen}`}
        isOpen={isNewDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={refresh}
      />
      <EditEnvelopeDialog
        key={`edit-reserve-${editingReserve?.id ?? "none"}-${isEditDialogOpen}`}
        envelope={editingReserve}
        isOpen={isEditDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refresh}
      />
      {modal}
    </>
  );
}
