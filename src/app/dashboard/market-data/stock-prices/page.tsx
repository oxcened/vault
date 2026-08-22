import { redirect } from "next/navigation";

export default function LegacyStockPricesPage() {
  redirect("/dashboard/settings/stock-prices");
}
