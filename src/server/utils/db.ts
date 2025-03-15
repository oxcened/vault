import { type PrismaClient } from "@prisma/client";
import { APP_CURRENCY } from "~/constants";

export async function updateNetWorthFromDate({
  db,
  date,
  createdBy,
}: {
  db: Pick<PrismaClient, "$queryRaw" | "netWorth">;
  date: Date;
  createdBy: string;
}) {
  return db.$queryRaw`CALL updateNetWorthFromDate(${date}, ${APP_CURRENCY}, ${createdBy})`;
}

export async function updateCashFlowFromDate({
  db,
  date,
  createdBy,
}: {
  db: Pick<PrismaClient, "$queryRaw" | "netWorth">;
  date: Date;
  createdBy: string;
}) {
  return db.$queryRaw`CALL updateCashFlowFromDate(${date}, ${APP_CURRENCY}, ${createdBy})`;
}
