import { redirect } from "next/navigation";

export default function LegacyExchangeRatesPage() {
  redirect("/dashboard/settings/exchange-rates");
}
