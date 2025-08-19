"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import NewDebtDialog from "./NewDebtDialog";
import { toast } from "sonner";
import NetWorthHoldings, {
  type Holding,
} from "~/components/holdings/net-worth-holdings";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import { useRouter } from "next/navigation";

export default function AssetsPage() {
  const {
    data = [],
    refetch,
    isPending,
  } = api.netWorthDebt.getAll.useQuery({
    date: new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    ),
  });

  const { mutate: deleteDebt } = api.netWorthDebt.delete.useMutation({
    onSuccess: () => {
      toast.success("Debt deleted.");
      handleDebtSuccess();
    },
  });

  const { mutate: archiveDebt } = api.netWorthDebt.update.useMutation({
    onSuccess: () => {
      toast.success("Debt archived.");
      handleDebtSuccess();
    },
  });

  const utils = api.useUtils();

  const [newDialog, setNewDialog] = useState(false);

  function handleDebtSuccess() {
    void refetch();
    void utils.netWorthOverview.get.invalidate();
    void utils.dashboard.getSummary.invalidate();
    void utils.netWorth.getAll.invalidate();
  }

  const mappedData: Holding[] = data.map((row) => ({
    ...row,
    id: row.debtId,
    name: row.debtName,
    currency: row.debtCurrency,
    archivedAt: row.debtArchivedAt,
  }));

  const { confirm, modal } = useConfirmDelete();
  const router = useRouter();

  return (
    <>
      <NetWorthHoldings
        holdings={mappedData}
        isFetching={isPending}
        holdingLabel="Debt"
        holdingLabelPlural="Debts"
        type="debt"
        onNewHolding={() => setNewDialog(true)}
        onEditHolding={(holding) =>
          router.push(`/dashboard/net-worth/debts/${holding.id}`)
        }
        onDeleteHolding={(holding) =>
          confirm({
            itemType: "debt",
            itemName: holding.name,
            onConfirm: () => deleteDebt({ id: holding.id }),
          })
        }
        onArchiveHolding={(holding) =>
          archiveDebt({ id: holding.id, archivedAt: new Date() })
        }
      />

      <NewDebtDialog
        key={String(newDialog)}
        isOpen={newDialog}
        onOpenChange={setNewDialog}
        onSuccess={handleDebtSuccess}
      />

      {modal}
    </>
  );
}
