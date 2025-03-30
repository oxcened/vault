import { recomputeDerivedDataForDependency } from "~/server/utils/db";
import { appEmitter } from "..";
import { db } from "~/server/db";

appEmitter.on("exchangeRate:updated", async ({ exchangeRateId }) => {
  await recomputeDerivedDataForDependency({
    db,
    dependencyType: "ExchangeRate",
    dependencyKey: exchangeRateId,
  });
});

appEmitter.on("stockPrice:updated", async ({ stockPriceId }) => {
  await recomputeDerivedDataForDependency({
    db,
    dependencyType: "StockPrice",
    dependencyKey: stockPriceId,
  });
});
