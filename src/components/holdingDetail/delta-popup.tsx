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
import { DECIMAL_ZERO } from "~/utils/number";

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
            <div className="text-right">
              {(!previousRow || !previousRow.quantity.eq(row.quantity)) && (
                <>
                  {" "}
                  <Number value={previousRow?.quantity ?? DECIMAL_ZERO} />{" "}
                  →{" "}
                </>
              )}
              <Number value={row.quantity} className="font-medium" />
            </div>

            {row.stockPrice && (
              <>
                <div>Stock price</div>
                <div className="text-right">
                  {(!previousRow ||
                    !(previousRow.stockPrice ?? DECIMAL_ZERO).eq(
                      row.stockPrice ?? DECIMAL_ZERO,
                    )) && (
                    <>
                      <Number value={previousRow?.stockPrice ?? DECIMAL_ZERO} />{" "}
                      →{" "}
                    </>
                  )}
                  <Number value={row.stockPrice} className="font-medium" />
                </div>
              </>
            )}

            {row.fxRate && (
              <>
                <div>FX Rate</div>
                <div className="text-right">
                  {(!previousRow ||
                    !(previousRow.fxRate ?? new Decimal(1)).eq(
                      row.fxRate ?? new Decimal(1),
                    )) && (
                    <>
                      <Number value={previousRow?.fxRate ?? new Decimal(1)} />{" "}
                      →{" "}
                    </>
                  )}
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
