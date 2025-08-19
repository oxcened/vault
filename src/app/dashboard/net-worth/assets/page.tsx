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

  const { mutate: archiveAsset } = api.netWorthAsset.update.useMutation({
    onSuccess: () => {
      toast.success("Asset archived.");
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

  return (
    <>
      <NetWorthHoldings
        holdings={mappedData}
        isFetching={isPending}
        holdingLabel="Asset"
        holdingLabelPlural="Assets"
        type="asset"
        onNewHolding={() => setNewDialog(true)}
        onEditHolding={(holding) =>
          router.push(`/dashboard/net-worth/assets/${holding.id}`)
        }
        onDeleteHolding={(holding) =>
          confirm({
            itemType: "asset",
            itemName: holding.name,
            onConfirm: () => deleteAsset({ id: holding.id }),
          })
        }
        onArchiveHolding={(holding) =>
          archiveAsset({ id: holding.id, archivedAt: new Date() })
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
