import { type PrismaClient } from "@prisma/client";
import { APP_CURRENCY } from "~/constants";

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

export async function recomputeCashFlowForUserFrom({
  db,
  userId,
  startDate,
}: {
  db: Pick<PrismaClient, "$executeRaw">;
  userId: string;
  startDate: Date;
}) {
  return db.$executeRaw`SELECT recompute_cash_flow_for_user_from(${userId}::TEXT, ${startDate}::DATE, ${APP_CURRENCY}::VARCHAR)`;
}

export async function recomputeCashFlowForUserMonth({
  db,
  userId,
  date,
}: {
  db: Pick<PrismaClient, "$executeRaw">;
  userId: string;
  date: Date;
}) {
  return db.$executeRaw`SELECT update_cash_flow_for_user_month(${userId}::TEXT, ${date}::TIMESTAMP, ${APP_CURRENCY}::VARCHAR)`;
}
