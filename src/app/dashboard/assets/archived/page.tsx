"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import NetWorthHoldings, {
  type Holding,
} from "~/components/holdings/net-worth-holdings";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import EditAssetDialog from "../EditAssetDialog";

export default function ArchivedAssetsPage() {
  const [date] = useState(() => new Date());
  const { data = [], isPending } = api.netWorthAsset.getAll.useQuery({
    date,
  });
  const utils = api.useUtils();
  const [editingAsset, setEditingAsset] = useState<Holding>();
  const { confirm, modal } = useConfirmDelete();

  function refresh() {
    void utils.netWorthAsset.getAll.invalidate();
    void utils.netWorthOverview.get.invalidate();
    void utils.dashboard.getSummary.invalidate();
    void utils.netWorth.getAll.invalidate();
    void utils.netWorthAsset.getDetailById.invalidate();
    void utils.netWorthAsset.getValueHistory.invalidate();
  }

  const { mutate: restoreAsset } = api.netWorthAsset.update.useMutation({
    onSuccess: () => {
      toast.success("Asset restored.");
      refresh();
    },
  });
  const { mutate: deleteAsset } = api.netWorthAsset.delete.useMutation({
    onSuccess: () => {
      toast.success("Asset deleted.");
      refresh();
    },
  });
  const holdings: Holding[] = data.map((row) => ({
    ...row,
    id: row.assetId,
    name: row.assetName,
    currency: row.assetCurrency,
    archivedAt: row.assetArchivedAt,
  }));

  return (
    <>
      <NetWorthHoldings
        holdings={holdings}
        isFetching={isPending}
        holdingLabel="Asset"
        holdingLabelPlural="Assets"
        type="asset"
        archivedOnly
        onEditHolding={setEditingAsset}
        onDeleteHolding={(holding) =>
          confirm({
            itemType: "asset",
            itemName: holding.name,
            onConfirm: () => deleteAsset({ id: holding.id }),
          })
        }
        onArchiveHolding={(holding) =>
          restoreAsset({ id: holding.id, archivedAt: null })
        }
        getHoldingDetailUrl={(holding) => `/dashboard/assets/${holding.id}`}
      />
      <EditAssetDialog
        key={editingAsset?.id}
        asset={editingAsset}
        isOpen={!!editingAsset}
        onOpenChange={(open) => !open && setEditingAsset(undefined)}
        onSuccess={refresh}
      />
      {modal}
    </>
  );
}
