import { env } from "~/env";
import { syncMarketData } from "~/server/market-data/sync";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (
    !env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncMarketData(env.ALPHA_VANTAGE_API_KEY);
    return Response.json(result, {
      status: result.failures.length ? 207 : 200,
    });
  } catch (error) {
    console.error("Market data sync failed", error);
    return Response.json({ error: "Market data sync failed" }, { status: 500 });
  }
}
