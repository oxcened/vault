import { api } from "~/trpc/react";
import { useDebouncedCallback } from "use-debounce";
import Decimal from "decimal.js";
import { toast } from "sonner";
import {
  HoldingDetailDialog,
  HoldingDetailMainTab,
  HoldingDetailValueTab,
} from "~/components/holding-detail.modal";

export type DebtDetailDialogProps = {
  isOpen: boolean;
  debtId?: string;
  onOpenChange: (newOpen: boolean) => void;
};

export function DebtDetailDialog({
  isOpen,
  debtId,
  onOpenChange,
}: DebtDetailDialogProps) {
  const { data, isPending, refetch } = api.netWorthDebt.getDetailById.useQuery(
    { id: debtId! },
    { enabled: !!debtId },
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

  const handleQuantityChange = useDebouncedCallback(
    ({ quantity, timestamp }: { quantity: string; timestamp: Date }) => {
      try {
        const decimalValue = new Decimal(quantity);
        if (!debtId) throw new Error("Debt ID not found");
        upsertQuantity({
          debtId,
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
        latestQuantity={data?.latestQuantity?.quantity}
        holdingId={data?.id}
        onQuantityChange={handleQuantityChange}
      />
      <HoldingDetailValueTab
        valueHistory={data?.valueHistory}
        holdingId={data?.id}
        onQuantityChange={handleQuantityChange}
      />
    </HoldingDetailDialog>
  );
}
