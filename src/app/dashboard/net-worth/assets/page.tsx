"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import NewAssetDialog from "./NewAssetDialog";
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
  } = api.netWorthAsset.getAll.useQuery({
    date: new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    ),
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

  function handleAssetSuccess() {
    void refetch();
    void utils.netWorthOverview.get.invalidate();
    void utils.dashboard.getSummary.invalidate();
    void utils.netWorth.getAll.invalidate();
  }

  const mappedData: Holding[] = data.map((row) => ({
    ...row,
    id: row.assetId,
    name: row.assetName,
    currency: row.assetCurrency,
    archivedAt: row.assetArchivedAt,
  }));

  const { confirm, modal } = useConfirmDelete();
  const router = useRouter();

  const handleEdit = (holding: Holding) =>
    router.push(`/dashboard/net-worth/assets/${holding.id}`);
  const handleDelete = (holding: Holding) => {
    confirm({
      itemType: "asset",
      itemName: holding.name,
      onConfirm: () => deleteAsset({ id: holding.id }),
    });
  };
  const handleArchive = (holding: Holding) => {
    patchAsset(
      { id: holding.id, archivedAt: new Date() },
      {
        onSuccess: () => toast.success("Asset archived."),
      },
    );
  };
  const handlePoolToEnvelopes = (holding: Holding) => {
    const newValue = !holding.poolInEnvelopes;

    patchAsset(
      {
        id: holding.id,
        poolInEnvelopes: newValue,
      },
      {
        onSuccess: () =>
          toast.success(
            newValue
              ? "Asset included in envelope pool."
              : "Asset not included in envelope pool.",
          ),
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
        onNewHolding={() => setNewDialog(true)}
        onEditHolding={handleEdit}
        onDeleteHolding={handleDelete}
        onArchiveHolding={handleArchive}
        onPoolToEnvelopesHolding={handlePoolToEnvelopes}
        getHoldingDetailUrl={(holding) =>
          `/dashboard/net-worth/assets/${holding.id}`
        }
      />

      <NewAssetDialog
        key={String(newDialog)}
        isOpen={newDialog}
        onOpenChange={setNewDialog}
        onSuccess={handleAssetSuccess}
      />

      {modal}
    </>
  );
}
