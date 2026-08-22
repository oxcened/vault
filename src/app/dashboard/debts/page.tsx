"use client";

import { useState } from "react";
import { lastDayOfMonth } from "date-fns";
import { api } from "~/trpc/react";
import NewDebtDialog from "./NewDebtDialog";
import { toast } from "sonner";
import NetWorthHoldings, {
  type Holding,
} from "~/components/holdings/net-worth-holdings";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import { useRouter } from "next/navigation";

export default function DebtsPage() {
  const [date, setDate] = useState(
    new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    ),
  );
  const { data = [], isPending } = api.netWorthDebt.getAll.useQuery({
    date,
  });

  const { mutate: deleteDebt } = api.netWorthDebt.delete.useMutation({
    onSuccess: () => {
      toast.success("Debt deleted.");
      handleDebtSuccess();
    },
  });

  const { mutate: patchDebt } = api.netWorthDebt.update.useMutation({
    onSuccess: () => {
      handleDebtSuccess();
    },
  });
  const { mutate: archiveDebt } = api.netWorthDebt.archive.useMutation({
    onSuccess: () => {
      toast.success("Debt changed to zero and archived.");
      handleDebtSuccess();
    },
  });

  const utils = api.useUtils();

  const [newDialog, setNewDialog] = useState(false);

  function handleDebtSuccess() {
    void utils.netWorthDebt.getAll.invalidate();
    void utils.netWorthOverview.get.invalidate();
    void utils.dashboard.getSummary.invalidate();
    void utils.netWorth.getAll.invalidate();
    void utils.netWorthDebt.getDetailById.invalidate();
    void utils.netWorthDebt.getValueHistory.invalidate();
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

  const handleEdit = (holding: Holding) =>
    router.push(`/dashboard/debts/${holding.id}`);
  const handleDelete = (holding: Holding) => {
    confirm({
      itemType: "debt",
      itemName: holding.name,
      onConfirm: () => deleteDebt({ id: holding.id }),
    });
  };
  const handleArchive = (holding: Holding) => {
    if (!holding.archivedAt) {
      archiveDebt({ id: holding.id });
      return;
    }
    patchDebt(
      { id: holding.id, archivedAt: null },
      { onSuccess: () => toast.success("Debt restored.") },
    );
  };

  return (
    <>
      <NetWorthHoldings
        holdings={mappedData}
        isFetching={isPending}
        holdingLabel="Debt"
        holdingLabelPlural="Debts"
        type="debt"
        date={date}
        onDateChange={(month) => setDate(lastDayOfMonth(month))}
        onNewHolding={() => setNewDialog(true)}
        onEditHolding={handleEdit}
        onDeleteHolding={handleDelete}
        onArchiveHolding={handleArchive}
        getHoldingDetailUrl={(holding) => `/dashboard/debts/${holding.id}`}
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
