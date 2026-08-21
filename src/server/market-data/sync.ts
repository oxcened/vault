import { APP_CURRENCY } from "~/constants";
import { db } from "~/server/db";
import { recomputeDerivedDataForDependency } from "~/server/utils/db";
import { toMonthTimestamp } from "~/utils/date";
import {
  convertEcbRate,
  fetchAlphaVantagePrice,
  fetchEcbRates,
} from "./providers";

type SyncFailure = { item: string; error: string };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

async function getRequiredCurrencies() {
  const [assets, debts, transactions, recurring, templates, existing] =
    await Promise.all([
      db.netWorthAsset.findMany({
        select: { currency: true },
        distinct: ["currency"],
      }),
      db.netWorthDebt.findMany({
        select: { currency: true },
        distinct: ["currency"],
      }),
      db.transaction.findMany({
        select: { currency: true },
        distinct: ["currency"],
      }),
      db.recurringTransaction.findMany({
        select: { currency: true },
        distinct: ["currency"],
      }),
      db.transactionTemplate.findMany({
        select: { currency: true },
        distinct: ["currency"],
      }),
      db.exchangeRate.findMany({
        where: { quoteCurrency: APP_CURRENCY },
        select: { baseCurrency: true },
        distinct: ["baseCurrency"],
      }),
    ]);

  return new Set(
    [
      ...assets,
      ...debts,
      ...transactions,
      ...recurring,
      ...templates,
      ...existing,
    ]
      .map((row) => ("currency" in row ? row.currency : row.baseCurrency))
      .map((currency) => currency.trim().toUpperCase())
      .filter((currency) => currency && currency !== APP_CURRENCY),
  );
}

export async function syncMarketData(alphaVantageApiKey?: string) {
  const timestamp = toMonthTimestamp(new Date());
  const failures: SyncFailure[] = [];
  let fxUpdated = 0;
  let stocksUpdated = 0;

  try {
    const [rates, currencies] = await Promise.all([
      fetchEcbRates(),
      getRequiredCurrencies(),
    ]);

    for (const baseCurrency of currencies) {
      const rate = convertEcbRate({
        baseCurrency,
        quoteCurrency: APP_CURRENCY,
        rates,
      });
      if (rate === null) {
        failures.push({
          item: `${baseCurrency}/${APP_CURRENCY}`,
          error: "ECB does not publish this currency",
        });
        continue;
      }

      const record = await db.exchangeRate.upsert({
        where: {
          base_quote_timestamp: {
            baseCurrency,
            quoteCurrency: APP_CURRENCY,
            timestamp,
          },
        },
        update: { rate },
        create: { baseCurrency, quoteCurrency: APP_CURRENCY, rate, timestamp },
      });
      await recomputeDerivedDataForDependency({
        db,
        dependencyType: "ExchangeRate",
        dependencyKey: record.id,
      });
      fxUpdated += 1;
    }
  } catch (error) {
    failures.push({ item: "FX", error: errorMessage(error) });
  }

  if (!alphaVantageApiKey) {
    failures.push({
      item: "stocks",
      error: "ALPHA_VANTAGE_API_KEY is not configured",
    });
  } else {
    const tickers = await db.stockTicker.findMany({
      orderBy: { ticker: "asc" },
    });
    for (const ticker of tickers) {
      try {
        const quote = await fetchAlphaVantagePrice(
          ticker.providerSymbol ?? ticker.ticker,
          alphaVantageApiKey,
        );
        const record = await db.stockPriceHistory.upsert({
          where: { ticker_timestamp: { tickerId: ticker.id, timestamp } },
          update: { price: quote.price },
          create: { tickerId: ticker.id, price: quote.price, timestamp },
        });
        await recomputeDerivedDataForDependency({
          db,
          dependencyType: "StockPrice",
          dependencyKey: record.id,
        });
        stocksUpdated += 1;
      } catch (error) {
        failures.push({ item: ticker.ticker, error: errorMessage(error) });
      }
    }
  }

  return { timestamp, fxUpdated, stocksUpdated, failures };
}
