import { recomputeNetWorthForUserFrom } from "~/server/utils/db";
import { appEmitter } from "..";
import { db } from "~/server/db";

appEmitter.on("netWorthAssetQuantity:updated", ({ userId, timestamp }) => {
  void recomputeNetWorthForUserFrom({
    db,
    userId,
    startDate: timestamp,
  });
});

appEmitter.on("netWorthDebtQuantity:updated", ({ userId, timestamp }) => {
  void recomputeNetWorthForUserFrom({
    db,
    userId,
    startDate: timestamp,
  });
});
