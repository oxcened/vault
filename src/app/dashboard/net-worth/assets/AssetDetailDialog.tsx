import { api } from "~/trpc/react";
import { useDebouncedCallback } from "use-debounce";
import Decimal from "decimal.js";
import { toast } from "sonner";
import {
  HoldingDetailDialog,
  HoldingDetailMainTab,
  HoldingDetailValueTab,
} from "~/components/holding-detail.modal";

export type AssetDetailDialogProps = {
  isOpen: boolean;
  assetId?: string;
  onOpenChange: (newOpen: boolean) => void;
};

export function AssetDetailDialog({
  isOpen,
  assetId,
  onOpenChange,
}: AssetDetailDialogProps) {
  const { data, isPending, refetch } = api.netWorthAsset.getDetailById.useQuery(
    {
      id: assetId!,
    },
    {
      enabled: !!assetId,
    },
  );
  const { mutate: upsertQuantity } =
    api.netWorthAsset.upsertQuantity.useMutation({
      onSuccess: () => {
        void refetch();
        void utils.netWorthOverview.get.invalidate();
        void utils.dashboard.getSummary.invalidate();
        void utils.netWorthAsset.getAll.invalidate();
        void utils.netWorth.getAll.invalidate();
      },
    });

  const utils = api.useUtils();

  const handleQuantityChange = useDebouncedCallback(
    ({ quantity, timestamp }: { quantity: string; timestamp: Date }) => {
      try {
        const decimalValue = new Decimal(quantity);
        if (!assetId) throw new Error("Asset ID not found");
        upsertQuantity({
          assetId,
          timestamp,
          quantity: decimalValue.toString(),
        });
      } catch (error) {
        const msg = `Invalid decimal input: ${quantity}`;
        console.error(msg);
        toast.error(msg);
      }
    },
    1000,
  );

  return (
    <HoldingDetailDialog
      isOpen={isOpen}
      isPending={isPending}
      categoryName={data?.category?.name}
      holdingComputedValue={data?.computedValue}
      holdingNativeComputedValue={data?.nativeComputedValue}
      holdingName={data?.name}
      holdingCurrency={data?.currency}
      onOpenChange={onOpenChange}
    >
      <HoldingDetailMainTab
        holdingCurrency={data?.currency}
        isCategoryStock={data?.category?.isStock}
        latestQuantity={data?.latestQuantity?.quantity}
        latestStockPrice={data?.latestStockPrice?.price}
        ticker={data?.ticker?.ticker}
        tickerName={data?.ticker?.name}
        tickerExchange={data?.ticker?.exchange}
        holdingId={data?.id}
        onQuantityChange={handleQuantityChange}
      />
      <HoldingDetailValueTab
        isCategoryStock={data?.category?.isStock}
        valueHistory={data?.valueHistory}
        holdingId={data?.id}
        onQuantityChange={handleQuantityChange}
      />
    </HoldingDetailDialog>
  );
}
