import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "../ui/button";
import { HelpCircleIcon } from "lucide-react";
import { Number } from "../ui/number";
import { ValueHistoryRow } from "./holding-detail";
import Decimal from "decimal.js";

export function DeltaPopup({
  row,
  previousRow,
}: {
  row: ValueHistoryRow;
  previousRow: ValueHistoryRow;
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
            {!previousRow.quantity.eq(row.quantity) && (
              <>
                <div>Quantity</div>
                <div className="text-right">
                  <Number value={previousRow.quantity} /> →{" "}
                  <Number value={row.quantity} className="font-medium" />
                </div>
              </>
            )}

            {!(previousRow.stockPrice ?? new Decimal(0)).eq(
              row.stockPrice ?? new Decimal(0),
            ) && (
              <>
                <div>Stock price</div>
                <div className="text-right">
                  <Number value={previousRow.stockPrice} /> →{" "}
                  <Number value={row.stockPrice} className="font-medium" />
                </div>
              </>
            )}

            {!(previousRow.fxRate ?? new Decimal(1)).eq(
              row.fxRate ?? new Decimal(1),
            ) && (
              <>
                <div>FX Rate</div>
                <div className="text-right">
                  <Number value={previousRow.fxRate} /> →{" "}
                  <Number value={row.fxRate} className="font-medium" />
                </div>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
