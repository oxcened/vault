import mitt from "mitt";

export type AppEvents = {
  "netWorthAssetQuantity:updated": { userId: string; timestamp: Date };
};

export const appEmitter = mitt<AppEvents>();
