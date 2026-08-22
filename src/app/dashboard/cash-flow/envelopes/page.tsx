import { redirect } from "next/navigation";

export default function LegacyReservesPage() {
  redirect("/dashboard/reserves");
}
