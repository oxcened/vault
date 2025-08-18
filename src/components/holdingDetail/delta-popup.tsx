import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "../ui/button";
import { HelpCircleIcon } from "lucide-react";
import { Number } from "../ui/number";
import { type ValueHistoryRow } from "./holding-detail";
import Decimal from "decimal.js";

export function DeltaPopup({
  row,
  previousRow,
}: {
  row: ValueHistoryRow;
  previousRow?: ValueHistoryRow;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          title="Show breakdown"
        >
          <HelpCircleIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="text-sm">
          <div className="grid grid-cols-2">
            <div>Quantity</div>

            <DeltaValue
              value={row.quantity}
              previousValue={previousRow?.quantity}
            />

            {row.stockPrice && (
              <>
                <div>Stock price</div>

                <DeltaValue
                  value={row.stockPrice}
                  previousValue={previousRow?.stockPrice}
                />
              </>
            )}

            {row.fxRate && (
              <>
                <div>FX Rate</div>

                <DeltaValue
                  value={row.fxRate}
                  previousValue={previousRow?.fxRate}
                />
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DeltaValue({
  value,
  previousValue,
}: {
  value: Decimal;
  previousValue?: Decimal | null;
}) {
  const newValueComponent = <Number value={value} className="font-medium" />;

  if (!previousValue) {
    return <div className="text-right">None → {newValueComponent}</div>;
  }

  if (previousValue.eq(value)) {
    return <div className="text-right">{newValueComponent} (Unchanged)</div>;
  }

  return (
    <div className="text-right">
      {!previousValue.eq(value) && (
        <>
          <Number value={previousValue} /> →{" "}
        </>
      )}
      {newValueComponent}
    </div>
  );
}
