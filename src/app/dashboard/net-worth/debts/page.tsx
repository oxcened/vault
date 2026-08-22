import { redirect } from "next/navigation";

export default function LegacyDebtsPage() {
  redirect("/dashboard/debts");
}
