import { type PrismaClient } from "@prisma/client";
import { APP_CURRENCY } from "~/constants";

export async function updateNetWorthFromDate({
  db,
  date,
  createdBy,
}: {
  db: Pick<PrismaClient, "$executeRaw">;
  date: Date;
  createdBy: string;
}) {
  return db.$executeRaw`SELECT update_net_worth_from_date(${date}::DATE, ${APP_CURRENCY}::VARCHAR, ${createdBy}::VARCHAR)`;
}

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
