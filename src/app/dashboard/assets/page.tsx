"use client";

import { useState } from "react";
import { lastDayOfMonth } from "date-fns";
import { api } from "~/trpc/react";
import NewAssetDialog from "./NewAssetDialog";
import { toast } from "sonner";
import NetWorthHoldings, {
  type Holding,
} from "~/components/holdings/net-worth-holdings";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import EditAssetDialog from "./EditAssetDialog";

export default function AssetsPage() {
  const [date, setDate] = useState(
    new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    ),
  );
  const {
    data = [],
    refetch,
    isPending,
  } = api.netWorthAsset.getAll.useQuery({
    date,
  });

  const { mutate: deleteAsset } = api.netWorthAsset.delete.useMutation({
    onSuccess: () => {
      toast.success("Asset deleted.");
      handleAssetSuccess();
    },
  });

  const { mutate: patchAsset } = api.netWorthAsset.update.useMutation({
    onSuccess: () => {
      handleAssetSuccess();
    },
  });

  const utils = api.useUtils();

  const [newDialog, setNewDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Holding>();

  function handleAssetSuccess() {
    void refetch();
    void utils.netWorthOverview.get.invalidate();
    void utils.dashboard.getSummary.invalidate();
    void utils.netWorth.getAll.invalidate();
    void utils.netWorthAsset.getDetailById.invalidate();
  }

  const mappedData: Holding[] = data.map((row) => ({
    ...row,
    id: row.assetId,
    name: row.assetName,
    currency: row.assetCurrency,
    archivedAt: row.assetArchivedAt,
  }));

  const { confirm, modal } = useConfirmDelete();
  const handleEdit = (holding: Holding) => setEditingAsset(holding);
  const handleDelete = (holding: Holding) => {
    confirm({
      itemType: "asset",
      itemName: holding.name,
      onConfirm: () => deleteAsset({ id: holding.id }),
    });
  };
  const handleArchive = (holding: Holding) => {
    const newValue = holding.archivedAt ? null : new Date();

    patchAsset(
      { id: holding.id, archivedAt: newValue },
      {
        onSuccess: () =>
          toast.success(newValue ? "Asset archived." : "Asset unarchived."),
      },
    );
  };
  return (
    <>
      <NetWorthHoldings
        holdings={mappedData}
        isFetching={isPending}
        holdingLabel="Asset"
        holdingLabelPlural="Assets"
        type="asset"
        date={date}
        onDateChange={(month) => setDate(lastDayOfMonth(month))}
        onNewHolding={() => setNewDialog(true)}
        onEditHolding={handleEdit}
        onDeleteHolding={handleDelete}
        onArchiveHolding={handleArchive}
        getHoldingDetailUrl={(holding) => `/dashboard/assets/${holding.id}`}
      />

      <NewAssetDialog
        key={String(newDialog)}
        isOpen={newDialog}
        onOpenChange={setNewDialog}
        onSuccess={handleAssetSuccess}
      />

      <EditAssetDialog
        key={editingAsset?.id}
        asset={editingAsset}
        isOpen={!!editingAsset}
        onOpenChange={(open) => !open && setEditingAsset(undefined)}
        onSuccess={handleAssetSuccess}
      />

      {modal}
    </>
  );
}
