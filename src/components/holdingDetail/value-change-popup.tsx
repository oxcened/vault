import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "../ui/button";
import { HelpCircleIcon } from "lucide-react";
import { Currency, Number } from "../ui/number";
import { type ValueHistoryRow } from "./holding-detail";
import { Separator } from "../ui/separator";
import Decimal from "decimal.js";
import { cn } from "~/lib/utils";

export function ValueChangePopup({
  row,
  previousRow,
}: {
  row: ValueHistoryRow;
  previousRow: ValueHistoryRow;
}) {
  const qtyDelta = row.quantity
    .minus(previousRow.quantity)
    .mul(previousRow.stockPrice ?? new Decimal(1))
    .mul(previousRow.fxRate ?? new Decimal(1));
  const stockDelta = row.quantity
    .mul(
      (row.stockPrice ?? new Decimal(1)).minus(
        previousRow.stockPrice ?? new Decimal(1),
      ),
    )
    .mul(previousRow.fxRate ?? new Decimal(1));
  const fxRateDelta = row.quantity
    .mul(row.stockPrice ?? new Decimal(1))
    .mul(
      (row.fxRate ?? new Decimal(1)).minus(
        previousRow.fxRate ?? new Decimal(1),
      ),
    );
  const totalDelta = row.valueInTarget.minus(previousRow.valueInTarget);

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
              <Number
                value={qtyDelta}
                options={{
                  signDisplay: "exceptZero",
                }}
                className={cn(
                  qtyDelta.isPos() && "text-financial-positive",
                  qtyDelta.isNeg() && "text-financial-negative",
                )}
              />
            </div>

            {row.stockPrice && (
              <>
                <div>Stock price</div>
                <div className="text-right">
                  <Number
                    value={stockDelta}
                    options={{
                      signDisplay: "exceptZero",
                    }}
                    className={cn(
                      stockDelta.isPos() && "text-financial-positive",
                      stockDelta.isNeg() && "text-financial-negative",
                    )}
                  />
                </div>
              </>
            )}

            {row.fxRate && (
              <>
                <div>FX Rate</div>
                <div className="text-right">
                  <Number
                    value={fxRateDelta}
                    options={{
                      signDisplay: "exceptZero",
                    }}
                    className={cn(
                      fxRateDelta.isPos() && "text-financial-positive",
                      fxRateDelta.isNeg() && "text-financial-negative",
                    )}
                  />
                </div>
              </>
            )}

            <Separator className="col-span-full my-2" />

            <div className="font-medium">Total</div>
            <div className="text-right font-medium">
              <Currency
                value={totalDelta}
                options={{
                  signDisplay: "exceptZero",
                }}
                className={cn(
                  totalDelta.isPos() && "text-financial-positive",
                  totalDelta.isNeg() && "text-financial-negative",
                )}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
