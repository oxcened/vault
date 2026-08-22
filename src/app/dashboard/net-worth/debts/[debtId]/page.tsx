import { redirect } from "next/navigation";

export default async function LegacyDebtPage({
  params,
}: {
  params: Promise<{ debtId: string }>;
}) {
  const { debtId } = await params;
  redirect(`/dashboard/debts/${debtId}`);
}
