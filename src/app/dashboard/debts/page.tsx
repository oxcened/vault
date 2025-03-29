"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import NewDebtDialog from "./NewDebtDialog";
import { type NetWorthAsset } from "@prisma/client";
import { DebtDetailDialog } from "./DebtDetailDialog";
import { toast } from "sonner";
import NetWorthHoldings from "~/components/net-worth-holdings";

export default function AssetsPage() {
  const { data = [], refetch, isPending } = api.netWorthDebt.getAll.useQuery();

  const { mutate: deleteDebt } = api.netWorthDebt.delete.useMutation({
    onSuccess: () => {
      toast.success("Debt deleted.");
      void refetch();
    },
  });

  const utils = api.useUtils();

  const [detailsDialog, setDetailsDialog] = useState<NetWorthAsset["id"]>();
  const [newDialog, setNewDialog] = useState(false);

  function handleDebtSuccess() {
    void refetch();
    void utils.netWorthOverview.get.invalidate();
    void utils.dashboard.getSummary.invalidate();
  }

  return (
    <>
      <NetWorthHoldings<(typeof data)[number]>
        holdings={data}
        isFetching={isPending}
        holdingLabel="Debt"
        holdingLabelPlural="Debts"
        onNewHolding={() => setNewDialog(true)}
        onEditHolding={(holding) => setDetailsDialog(holding.id)}
        onDeleteHolding={(holding) => deleteDebt({ id: holding.id })}
      />

      <NewDebtDialog
        key={String(newDialog)}
        isOpen={newDialog}
        onOpenChange={setNewDialog}
        onSuccess={handleDebtSuccess}
      />

      <DebtDetailDialog
        isOpen={!!detailsDialog}
        debtId={detailsDialog}
        onOpenChange={() => setDetailsDialog(undefined)}
      />
    </>
  );
}
