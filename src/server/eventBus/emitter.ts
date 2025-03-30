import mitt from "mitt";

export type AppEvents = {
  "netWorthAssetQuantity:updated": { userId: string; timestamp: Date };
  "netWorthDebtQuantity:updated": { userId: string; timestamp: Date };
  "transaction:updated": { userId: string; timestamp: Date };
};

export const appEmitter = mitt<AppEvents>();
