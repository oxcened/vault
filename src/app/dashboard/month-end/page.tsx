import { redirect } from "next/navigation";

export default function LegacyMonthEndPage() {
  redirect("/dashboard/monthly-update");
}
