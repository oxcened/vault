"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import NetWorthHoldings, {
  type Holding,
} from "~/components/holdings/net-worth-holdings";
import { useConfirmDelete } from "~/components/confirm-delete-modal";

export default function ArchivedDebtsPage() {
  const router = useRouter();
  const [date] = useState(() => new Date());
  const { data = [], isPending } = api.netWorthDebt.getAll.useQuery({
    date,
  });
  const utils = api.useUtils();
  const { confirm, modal } = useConfirmDelete();

  function refresh() {
    void utils.netWorthDebt.getAll.invalidate();
    void utils.netWorthOverview.get.invalidate();
    void utils.dashboard.getSummary.invalidate();
    void utils.netWorth.getAll.invalidate();
    void utils.netWorthDebt.getDetailById.invalidate();
    void utils.netWorthDebt.getValueHistory.invalidate();
  }

  const { mutate: restoreDebt } = api.netWorthDebt.update.useMutation({
    onSuccess: () => {
      toast.success("Debt restored.");
      refresh();
    },
  });
  const { mutate: deleteDebt } = api.netWorthDebt.delete.useMutation({
    onSuccess: () => {
      toast.success("Debt deleted.");
      refresh();
    },
  });
  const holdings: Holding[] = data.map((row) => ({
    ...row,
    id: row.debtId,
    name: row.debtName,
    currency: row.debtCurrency,
    archivedAt: row.debtArchivedAt,
  }));

  return (
    <>
      <NetWorthHoldings
        holdings={holdings}
        isFetching={isPending}
        holdingLabel="Debt"
        holdingLabelPlural="Debts"
        type="debt"
        archivedOnly
        onEditHolding={(holding) =>
          router.push(`/dashboard/debts/${holding.id}`)
        }
        onDeleteHolding={(holding) =>
          confirm({
            itemType: "debt",
            itemName: holding.name,
            onConfirm: () => deleteDebt({ id: holding.id }),
          })
        }
        onArchiveHolding={(holding) =>
          restoreDebt({ id: holding.id, archivedAt: null })
        }
        getHoldingDetailUrl={(holding) => `/dashboard/debts/${holding.id}`}
      />
      {modal}
    </>
  );
}
