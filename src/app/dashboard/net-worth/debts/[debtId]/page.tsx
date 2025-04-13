"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import Decimal from "decimal.js";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { HoldingDetail } from "~/components/holding-detail";

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

  const { mutate: upsertQuantity } =
    api.netWorthDebt.upsertQuantity.useMutation({
      onSuccess: () => {
        void refetch();
        void utils.netWorthOverview.get.invalidate();
        void utils.dashboard.getSummary.invalidate();
        void utils.netWorthDebt.getAll.invalidate();
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
      if (!parsedDebtId) throw new Error("Debt ID not found");
      upsertQuantity({
        debtId: parsedDebtId,
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
      isCategoryStock={data?.category?.isStock}
      valueHistory={data?.valueHistory?.map((item) => ({
        ...item,
        timestamp: item.debtTimestamp,
      }))}
      holdingId={data?.id}
      holdingCurrency={data?.currency}
      isPending={isPending}
      holdingComputedValue={data?.computedValue}
      holdingName={data?.name}
      type="debt"
      onQuantityChange={debouncedChangeQuantity}
    />
  );
}
