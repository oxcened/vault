"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { HoldingDetail } from "~/components/holdingDetail/holding-detail";
import NewQuantityDialog from "./NewQuantityDialog";
import { useMemo, useState } from "react";
import EditQuantityDialog from "./EditQuantityDialog";
import EditDebtDialog from "../EditDebtDialog";

export default function DebtDetailPage() {
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
    data: historyPages,
    isPending: isPendingHistory,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchHistory,
  } = api.netWorthDebt.getValueHistory.useInfiniteQuery(
    { debtId: parsedDebtId!, limit: 25 },
    {
      enabled: !!parsedDebtId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const valueHistory = useMemo(
    () =>
      historyPages?.pages.flatMap((page) =>
        page.items.map((item) => ({
          ...item,
          timestamp: item.debtTimestamp,
        })),
      ) ?? [],
    [historyPages],
  );
  const nextValueHistoryRow = historyPages?.pages.at(-1)?.nextItem;

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
  const [isEditDebtOpen, setEditDebtOpen] = useState(false);

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
    void refetchHistory();
    void utils.netWorthOverview.get.invalidate();
    void utils.dashboard.getSummary.invalidate();
    void utils.netWorthDebt.getAll.invalidate();
    void utils.netWorth.getAll.invalidate();
  }

  return (
    <>
      <HoldingDetail
        isCategoryStock={data?.category?.isStock}
        valueHistory={valueHistory}
        nextValueHistoryRow={
          nextValueHistoryRow
            ? {
                ...nextValueHistoryRow,
                timestamp: nextValueHistoryRow.debtTimestamp,
              }
            : undefined
        }
        hasMoreValueHistory={hasNextPage}
        isFetchingMoreValueHistory={isFetchingNextPage}
        onLoadMoreValueHistory={() => void fetchNextPage()}
        holdingCurrency={data?.currency}
        isPending={isPending || isPendingQuantities || isPendingHistory}
        holdingComputedValue={data?.computedValue}
        holdingName={data?.name}
        holdingCategory={data?.category?.name}
        type="debt"
        archivedAt={data?.archivedAt}
        onQuantityEdit={handleQuantityEdit}
        onQuantityDelete={({ timestamp }) =>
          deleteQuantity({
            timestamp,
            debtId: parsedDebtId!,
          })
        }
        onNewHolding={() => setNewDialogOpen(true)}
        onEditHolding={() => setEditDebtOpen(true)}
      />

      <EditDebtDialog
        key={`edit-debt-${isEditDebtOpen}`}
        debt={
          data?.id && data.name && data.categoryId && data.currency
            ? {
                id: data.id,
                name: data.name,
                categoryId: data.categoryId,
                currency: data.currency,
              }
            : undefined
        }
        isOpen={isEditDebtOpen}
        onOpenChange={setEditDebtOpen}
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
