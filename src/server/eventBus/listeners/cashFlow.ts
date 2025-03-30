import { recomputeCashFlowForUserFrom } from "~/server/utils/db";
import { appEmitter } from "..";
import { db } from "~/server/db";

appEmitter.on("transaction:updated", ({ userId, timestamp }) => {
  void recomputeCashFlowForUserFrom({
    db,
    userId,
    startDate: timestamp,
  });
});
