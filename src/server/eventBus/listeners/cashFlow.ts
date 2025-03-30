import { recomputeCashFlowForUserFrom } from "~/server/utils/db";
import { appEmitter } from "..";
import { db } from "~/server/db";

appEmitter.on("transaction:updated", async ({ userId, timestamp }) => {
  await recomputeCashFlowForUserFrom({
    db,
    userId,
    startDate: timestamp,
  });
});
