import { recomputeCashFlowForUserMonth } from "~/server/utils/db";
import { appEmitter } from "../emitter";
import { db } from "~/server/db";

appEmitter.on("transaction:updated", ({ userId, timestamp }) => {
  void recomputeCashFlowForUserMonth({
    db,
    userId,
    date: timestamp,
  });
});
