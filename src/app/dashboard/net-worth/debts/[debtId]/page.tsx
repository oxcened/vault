"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { HoldingDetail } from "~/components/holding-detail";
import NewQuantityDialog from "./NewQuantityDialog";
import { useState } from "react";
import EditQuantityDialog from "./EditQuantityDialog";

export default function AssetDetailPage() {
  const { debtId } = useParams();
  const parsedDebtId = Array.isArray(debtId) ? debtId[0] : debtId;

  const { data, isPending, refetch } = api.netWorthDebt.getDetailById.useQuery(
    {
      id: parsedDebtId!,
    },
    {
      enabled: !!parsedDebtId,
    },
  );

  const {
    data: quantitiesData = [],
    isPending: isPendingQuantities,
    refetch: refetchQuantities,
  } = api.netWorthDebt.getQuantitiesByDebtId.useQuery(
    {
      debtId: parsedDebtId!,
    },
    {
      enabled: !!parsedDebtId,
    },
  );

  const { mutate: deleteQuantity } =
    api.netWorthDebt.deleteQuantityByTimestamp.useMutation({
      onSuccess: handleQuantitySuccess,
    });

  const utils = api.useUtils();

  const [isNewDialogOpen, setNewDialogOpen] = useState(false);
  const [editingQuantity, setEditingQuantity] =
    useState<(typeof quantitiesData)[number]>();
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

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
        isCategoryStock={data?.category?.isStock}
        valueHistory={data?.valueHistory?.map((item) => ({
          ...item,
          timestamp: item.debtTimestamp,
        }))}
        quantityHistory={quantitiesData}
        holdingCurrency={data?.currency}
        isPending={isPending || isPendingQuantities}
        holdingComputedValue={data?.computedValue}
        holdingName={data?.name}
        type="asset"
        onQuantityEdit={handleQuantityEdit}
        onQuantityDelete={({ timestamp }) =>
          deleteQuantity({
            timestamp,
            debtId: parsedDebtId!,
          })
        }
        onNewHolding={() => setNewDialogOpen(true)}
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
