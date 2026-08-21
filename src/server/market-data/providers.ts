const ECB_DAILY_RATES_URL =
  "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query";

export async function fetchEcbRates(): Promise<Map<string, number>> {
  const response = await fetch(ECB_DAILY_RATES_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`ECB request failed with HTTP ${response.status}`);
  }

  const xml = await response.text();
  const rates = new Map<string, number>([["EUR", 1]]);
  const ratePattern = /currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g;

  for (const match of xml.matchAll(ratePattern)) {
    const currency = match[1];
    const rate = Number(match[2]);
    if (currency && Number.isFinite(rate) && rate > 0)
      rates.set(currency, rate);
  }

  if (rates.size === 1)
    throw new Error("ECB response contained no exchange rates");
  return rates;
}

export function convertEcbRate({
  baseCurrency,
  quoteCurrency,
  rates,
}: {
  baseCurrency: string;
  quoteCurrency: string;
  rates: Map<string, number>;
}) {
  const base = rates.get(baseCurrency.toUpperCase());
  const quote = rates.get(quoteCurrency.toUpperCase());
  if (!base || !quote) return null;
  return quote / base;
}

type AlphaVantageQuote = {
  "Global Quote"?: {
    "05. price"?: string;
    "07. latest trading day"?: string;
  };
  Note?: string;
  Information?: string;
  "Error Message"?: string;
};

export async function fetchAlphaVantagePrice(symbol: string, apiKey: string) {
  const url = new URL(ALPHA_VANTAGE_URL);
  url.searchParams.set("function", "GLOBAL_QUOTE");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Alpha Vantage request failed with HTTP ${response.status}`,
    );
  }

  const body = (await response.json()) as AlphaVantageQuote;
  const quote = body["Global Quote"];
  const price = Number(quote?.["05. price"]);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(
      body["Error Message"] ??
        body.Note ??
        body.Information ??
        `No price returned for ${symbol}`,
    );
  }

  return { price, tradingDay: quote?.["07. latest trading day"] ?? null };
}
