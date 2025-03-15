import { Prisma } from "@prisma/client";
import { DECIMAL_ZERO } from "~/utils/number";

export function getPercentageDiff(a?: Prisma.Decimal, b?: Prisma.Decimal) {
  if (a === undefined || b === undefined) return undefined;
  if (b.eq(0))
    return a.gt(0)
      ? new Prisma.Decimal(100)
      : a.lt(0)
        ? new Prisma.Decimal(-100)
        : DECIMAL_ZERO;
  return a.minus(b).div(b.abs());
}
