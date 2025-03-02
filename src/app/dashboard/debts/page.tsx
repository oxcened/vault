"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import NewDebtDialog from "./NewDebtDialog";
import { NetWorthAsset } from "@prisma/client";
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

  const [detailsDialog, setDetailsDialog] = useState<NetWorthAsset["id"]>();
  const [newDialog, setNewDialog] = useState(false);

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
        isOpen={newDialog}
        onOpenChange={setNewDialog}
        onSuccess={refetch}
      />

      <DebtDetailDialog
        isOpen={!!detailsDialog}
        debtId={detailsDialog}
        onOpenChange={() => setDetailsDialog(undefined)}
      />
    </>
  );
}
