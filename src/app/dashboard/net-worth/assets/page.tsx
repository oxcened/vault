"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import NewAssetDialog from "./NewAssetDialog";
import { AssetDetailDialog } from "./AssetDetailDialog";
import { type NetWorthAsset } from "@prisma/client";
import { toast } from "sonner";
import NetWorthHoldings, { Holding } from "~/components/net-worth-holdings";

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
      void refetch();
    },
  });

  const utils = api.useUtils();

  const [detailsDialog, setDetailsDialog] = useState<NetWorthAsset["id"]>();

  const [newDialog, setNewDialog] = useState(false);

  function handleAssetSuccess() {
    void refetch();
    void utils.netWorthOverview.get.invalidate();
    void utils.dashboard.getSummary.invalidate();
  }

  const mappedData: Holding[] = data.map((row) => ({
    ...row,
    id: row.assetId,
    name: row.assetName,
    currency: row.assetCurrency,
  }));

  return (
    <>
      <NetWorthHoldings
        holdings={mappedData}
        isFetching={isPending}
        holdingLabel="Asset"
        holdingLabelPlural="Assets"
        onNewHolding={() => setNewDialog(true)}
        onEditHolding={(holding) => setDetailsDialog(holding.id)}
        onDeleteHolding={(holding) => deleteAsset({ id: holding.id })}
      />

      <NewAssetDialog
        key={String(newDialog)}
        isOpen={newDialog}
        onOpenChange={setNewDialog}
        onSuccess={handleAssetSuccess}
      />

      <AssetDetailDialog
        isOpen={!!detailsDialog}
        assetId={detailsDialog}
        onOpenChange={() => setDetailsDialog(undefined)}
      />
    </>
  );
}
