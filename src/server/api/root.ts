import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { netWorthAssetRouter } from "./routers/netWorthAsset";
import { netWorthRouter } from "./routers/netWorth";
import { exchangeRateRouter } from "./routers/exchangeRate";
import { stockPriceRouter } from "./routers/stockPrice";
import { netWorthOverviewRouter } from "./routers/netWorthOverview";
import { netWorthDebtRouter } from "./routers/netWorthDebt";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  netWorthAsset: netWorthAssetRouter,
  netWorthDebt: netWorthDebtRouter,
  netWorth: netWorthRouter,
  exchangeRate: exchangeRateRouter,
  stockPrice: stockPriceRouter,
  netWorthOverview: netWorthOverviewRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
