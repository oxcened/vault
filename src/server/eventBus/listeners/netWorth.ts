import { recomputeNetWorthForUserFrom } from "~/server/utils/db";
import { appEmitter } from "..";
import { db } from "~/server/db";

appEmitter.on(
  "netWorthAssetQuantity:updated",
  async ({ userId, timestamp }) => {
    await recomputeNetWorthForUserFrom({
      db,
      userId,
      startDate: timestamp,
    });
  },
);

appEmitter.on("netWorthDebtQuantity:updated", async ({ userId, timestamp }) => {
  await recomputeNetWorthForUserFrom({
    db,
    userId,
    startDate: timestamp,
  });
});
