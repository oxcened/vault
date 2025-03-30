import { type PrismaClient } from "@prisma/client";
import { APP_CURRENCY } from "~/constants";

export async function updateCashFlowFromDate({
  db,
  date,
  createdBy,
}: {
  db: Pick<PrismaClient, "$executeRaw">;
  date: Date;
  createdBy: string;
}) {
  return db.$executeRaw`SELECT update_cash_flow_from_date(${date}::DATE, ${APP_CURRENCY}::VARCHAR, ${createdBy}::VARCHAR)`;
}

export async function recomputeDerivedDataForDependency({
  db,
  dependencyType,
  dependencyKey,
}: {
  db: Pick<PrismaClient, "$executeRaw">;
  dependencyType: "ExchangeRate" | "StockPrice";
  dependencyKey: string;
}) {
  return db.$executeRaw`SELECT recompute_derived_data_for_dependency(${dependencyType}::TEXT, ${dependencyKey}::TEXT, ${APP_CURRENCY}::VARCHAR)`;
}

export async function recomputeNetWorthForUserFrom({
  db,
  userId,
  startDate,
}: {
  db: Pick<PrismaClient, "$executeRaw">;
  userId: string;
  startDate: Date;
}) {
  return db.$executeRaw`SELECT recompute_net_worth_for_user_from(${userId}::TEXT, ${startDate}::DATE, ${APP_CURRENCY}::VARCHAR)`;
}
