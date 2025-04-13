"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import Decimal from "decimal.js";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { HoldingDetail } from "~/components/holding-detail";

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

  function changeQuantity({
    quantity,
    timestamp,
  }: {
    quantity: string;
    timestamp: Date;
  }) {
    try {
      const decimalValue = new Decimal(quantity);
      if (!parsedAssetId) throw new Error("Asset ID not found");
      upsertQuantity({
        assetId: parsedAssetId,
        timestamp,
        quantity: decimalValue.toString(),
      });
    } catch (error) {
      const msg = `Invalid decimal input: ${quantity}`;
      console.error(msg);
      toast.error(msg);
    }
  }

  const debouncedChangeQuantity = useDebouncedCallback(changeQuantity, 1000);

  return (
    <HoldingDetail
      ticker={data?.ticker?.ticker}
      isCategoryStock={data?.category?.isStock}
      valueHistory={data?.valueHistory?.map((item) => ({
        ...item,
        timestamp: item.assetTimestamp,
      }))}
      holdingId={data?.id}
      holdingCurrency={data?.currency}
      latestStockPrice={data?.latestStockPrice?.price}
      tickerName={data?.ticker?.name}
      tickerExchange={data?.ticker?.exchange}
      isPending={isPending}
      holdingComputedValue={data?.computedValue}
      holdingName={data?.name}
      type="asset"
      onQuantityChange={debouncedChangeQuantity}
    />
  );
}
