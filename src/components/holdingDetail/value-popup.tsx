import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "../ui/button";
import { HelpCircleIcon } from "lucide-react";
import { Currency, Number } from "../ui/number";
import { ValueHistoryRow } from "./holding-detail";
import { Separator } from "../ui/separator";

export function ValuePopup({ row }: { row: ValueHistoryRow }) {
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
              <Number value={row.quantity} />{" "}
              {row.stockPrice || row.fxRate ? "×" : "="}
            </div>

            {row.stockPrice && (
              <>
                <div>Stock price</div>
                <div className="text-right">
                  <Number value={row.stockPrice} /> {row.fxRate ? "×" : "="}
                </div>
              </>
            )}

            {row.fxRate && (
              <>
                <div>FX Rate</div>
                <div className="text-right">
                  <Number value={row.fxRate} /> =
                </div>
              </>
            )}

            <Separator className="col-span-full my-2" />

            <div className="font-medium">Total</div>
            <div className="text-right font-medium">
              <Currency value={row.valueInTarget} />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
