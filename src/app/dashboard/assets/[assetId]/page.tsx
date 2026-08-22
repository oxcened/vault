"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { HoldingDetail } from "~/components/holdingDetail/holding-detail";
import NewQuantityDialog from "./NewQuantityDialog";
import { useState } from "react";
import EditQuantityDialog from "./EditQuantityDialog";
import EditAssetDialog from "../EditAssetDialog";

export default function AssetDetailPage() {
  const { assetId } = useParams();
  const parsedAssetId = Array.isArray(assetId) ? assetId[0] : assetId;

  const { data, isPending, refetch } = api.netWorthAsset.getDetailById.useQuery(
    {
      id: parsedAssetId!,
    },
    {
      enabled: !!parsedAssetId,
    },
  );

  const {
    data: quantitiesData = [],
    isPending: isPendingQuantities,
    refetch: refetchQuantities,
  } = api.netWorthAsset.getQuantitiesByAssetId.useQuery(
    {
      assetId: parsedAssetId!,
    },
    {
      enabled: !!parsedAssetId,
    },
  );

  const { mutate: deleteQuantity } =
    api.netWorthAsset.deleteQuantityByTimestamp.useMutation({
      onSuccess: handleQuantitySuccess,
    });

  const utils = api.useUtils();

  const [isNewDialogOpen, setNewDialogOpen] = useState(false);
  const [editingQuantity, setEditingQuantity] =
    useState<(typeof quantitiesData)[number]>();
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isEditAssetOpen, setEditAssetOpen] = useState(false);

  function handleQuantityEdit({ id }: { id: string }) {
    const quantity = quantitiesData.find((quantity) => quantity.id === id);
    if (!quantity) {
      toast.error("Failed to find quantity.");
      return;
    }
    setEditingQuantity(quantity);
    setEditDialogOpen(true);
  }

  function handleQuantitySuccess() {
    void refetchQuantities();
    void refetch();
    void utils.netWorthOverview.get.invalidate();
    void utils.dashboard.getSummary.invalidate();
    void utils.netWorthAsset.getAll.invalidate();
    void utils.netWorth.getAll.invalidate();
  }

  return (
    <>
      <HoldingDetail
        ticker={data?.ticker?.ticker}
        isCategoryStock={data?.category?.isStock}
        valueHistory={data?.valueHistory?.map((item) => ({
          ...item,
          timestamp: item.assetTimestamp,
        }))}
        holdingCurrency={data?.currency}
        latestStockPrice={data?.latestStockPrice?.price}
        tickerName={data?.ticker?.name}
        tickerExchange={data?.ticker?.exchange}
        isPending={isPending || isPendingQuantities}
        holdingComputedValue={data?.computedValue}
        quantity={data?.latestQuantity?.quantity}
        holdingName={data?.name}
        holdingCategory={data?.category?.name}
        isLiquid={data?.isLiquid}
        type="asset"
        archivedAt={data?.archivedAt}
        onQuantityEdit={handleQuantityEdit}
        onQuantityDelete={({ timestamp }) =>
          deleteQuantity({
            timestamp,
            assetId: parsedAssetId!,
          })
        }
        onNewHolding={() => setNewDialogOpen(true)}
        onEditHolding={() => setEditAssetOpen(true)}
      />

      <EditAssetDialog
        key={`edit-asset-${isEditAssetOpen}`}
        asset={
          data?.id && data.name && data.categoryId && data.currency
            ? {
                id: data.id,
                name: data.name,
                categoryId: data.categoryId,
                currency: data.currency,
                tickerId: data.tickerId,
                isLiquid: data.isLiquid,
              }
            : undefined
        }
        isOpen={isEditAssetOpen}
        onOpenChange={setEditAssetOpen}
        onSuccess={handleQuantitySuccess}
      />

      <NewQuantityDialog
        key={`new-quantity-dialog-${isNewDialogOpen}`}
        isOpen={isNewDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={handleQuantitySuccess}
      />

      <EditQuantityDialog
        key={`edit-quantity-dialog-${isNewDialogOpen}`}
        isOpen={isEditDialogOpen}
        onOpenChange={setEditDialogOpen}
        quantity={editingQuantity}
        onSuccess={handleQuantitySuccess}
      />
    </>
  );
}
