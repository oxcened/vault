import { recomputeDerivedDataForDependency } from "~/server/utils/db";
import { appEmitter } from "..";
import { db } from "~/server/db";

appEmitter.on("exchangeRate:updated", ({ exchangeRateId }) => {
  void recomputeDerivedDataForDependency({
    db,
    dependencyType: "ExchangeRate",
    dependencyKey: exchangeRateId,
  });
});

appEmitter.on("stockPrice:updated", ({ stockPriceId }) => {
  void recomputeDerivedDataForDependency({
    db,
    dependencyType: "StockPrice",
    dependencyKey: stockPriceId,
  });
});
