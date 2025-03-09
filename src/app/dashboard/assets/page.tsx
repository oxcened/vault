"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import NewAssetDialog from "./NewAssetDialog";
import { AssetDetailDialog } from "./AssetDetailDialog";
import { NetWorthAsset } from "@prisma/client";
import { toast } from "sonner";
import NetWorthHoldings from "~/components/net-worth-holdings";

export default function AssetsPage() {
  const { data = [], refetch, isPending } = api.netWorthAsset.getAll.useQuery();

  const { mutate: deleteAsset } = api.netWorthAsset.delete.useMutation({
    onSuccess: () => {
      toast.success("Asset deleted.");
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
        onSuccess={refetch}
      />

      <AssetDetailDialog
        isOpen={!!detailsDialog}
        assetId={detailsDialog}
        onOpenChange={() => setDetailsDialog(undefined)}
      />
    </>
  );
}
