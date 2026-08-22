import { type Prisma, type PrismaClient } from "@prisma/client";
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

export async function getAssetValuesForUserMonth({
  db,
  userId,
  startDate,
}: {
  db: Pick<PrismaClient, "$queryRaw">;
  userId: string;
  startDate: Date;
}): Promise<
  {
    quantityId: string;
    createdById: string;
    timestamp: Date;
    quantity: Prisma.Decimal | null;
    assetCurrency: string;
    tickerId: string | null;
    stockPrice: Prisma.Decimal | null;
    stockPriceId: string | null;
    fxRate: Prisma.Decimal | null;
    exchangeRateId: string | null;
    valueInTarget: Prisma.Decimal;
    assetId: string;
    assetName: string;
    stockTicker: string | null;
    categoryId: string;
    categoryName: string;
    assetArchivedAt: Date | null;
    isLiquid: boolean;
  }[]
> {
  return db.$queryRaw`SELECT * FROM get_asset_values_for_user_month(${userId}::TEXT, ${startDate}::TIMESTAMP, ${APP_CURRENCY}::VARCHAR)`;
}

export async function getDebtValuesForUserMonth({
  db,
  userId,
  startDate,
}: {
  db: Pick<PrismaClient, "$queryRaw">;
  userId: string;
  startDate: Date;
}): Promise<
  {
    quantityId: string;
    createdById: string;
    timestamp: Date;
    quantity: Prisma.Decimal | null;
    debtCurrency: string;
    fxRate: Prisma.Decimal | null;
    exchangeRateId: string | null;
    valueInTarget: Prisma.Decimal;
    debtId: string;
    debtName: string;
    categoryId: string;
    categoryName: string;
    debtArchivedAt: Date | null;
  }[]
> {
  return db.$queryRaw`SELECT * FROM get_debt_values_for_user_month(${userId}::TEXT, ${startDate}::TIMESTAMP, ${APP_CURRENCY}::VARCHAR)`;
}

export async function getConvertedTransactionsForUserMonth({
  db,
  userId,
  date,
}: {
  db: Pick<PrismaClient, "$queryRaw">;
  userId: string;
  date: Date;
}): Promise<
  {
    id: string;
    timestamp: Date;
    original_amount: Prisma.Decimal;
    converted_amount: Prisma.Decimal;
    currency: string;
    category_id: string;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    exchange_rate_id: string | null;
  }[]
> {
  return db.$queryRaw`SELECT * FROM get_converted_transactions_for_user_month(${userId}::TEXT, ${date}::TIMESTAMP, ${APP_CURRENCY}::VARCHAR)`;
}

export async function getAssetValueHistory({
  db,
  userId,
  assetId,
  cursor,
  limit,
}: {
  db: Pick<PrismaClient, "$queryRaw">;
  userId: string;
  assetId: string;
  cursor?: Date | null;
  limit?: number;
}): Promise<
  {
    assetTimestamp: Date;
    quantity: Prisma.Decimal;
    quantityId: string | null;
    quantityIsCarried: boolean | null;
    stockPrice: Prisma.Decimal | null;
    stockPriceId: string | null;
    stockPriceIsCarried: boolean | null;
    fxRate: Prisma.Decimal | null;
    fxRateId: string | null;
    fxRateIsCarried: boolean | null;
    valueInTarget: Prisma.Decimal;
  }[]
> {
  if (cursor && limit) {
    return db.$queryRaw`SELECT * FROM get_asset_value_history(${userId}::TEXT, ${assetId}::TEXT, ${APP_CURRENCY}::VARCHAR) WHERE "assetTimestamp" < ${cursor} ORDER BY "assetTimestamp" DESC LIMIT ${limit}`;
  }
  if (limit) {
    return db.$queryRaw`SELECT * FROM get_asset_value_history(${userId}::TEXT, ${assetId}::TEXT, ${APP_CURRENCY}::VARCHAR) ORDER BY "assetTimestamp" DESC LIMIT ${limit}`;
  }
  return db.$queryRaw`SELECT * FROM get_asset_value_history(${userId}::TEXT, ${assetId}::TEXT, ${APP_CURRENCY}::VARCHAR) ORDER BY "assetTimestamp" DESC`;
}

export async function getDebtValueHistory({
  db,
  userId,
  debtId,
  cursor,
  limit,
}: {
  db: Pick<PrismaClient, "$queryRaw">;
  userId: string;
  debtId: string;
  cursor?: Date | null;
  limit?: number;
}): Promise<
  {
    debtTimestamp: Date;
    quantity: Prisma.Decimal;
    quantityId: string | null;
    quantityIsCarried: boolean | null;
    fxRate: Prisma.Decimal | null;
    fxRateId: string | null;
    fxRateIsCarried: boolean | null;
    valueInTarget: Prisma.Decimal;
  }[]
> {
  if (cursor && limit) {
    return db.$queryRaw`SELECT * FROM get_debt_value_history(${userId}::TEXT, ${debtId}::TEXT, ${APP_CURRENCY}::VARCHAR) WHERE "debtTimestamp" < ${cursor} ORDER BY "debtTimestamp" DESC LIMIT ${limit}`;
  }
  if (limit) {
    return db.$queryRaw`SELECT * FROM get_debt_value_history(${userId}::TEXT, ${debtId}::TEXT, ${APP_CURRENCY}::VARCHAR) ORDER BY "debtTimestamp" DESC LIMIT ${limit}`;
  }
  return db.$queryRaw`SELECT * FROM get_debt_value_history(${userId}::TEXT, ${debtId}::TEXT, ${APP_CURRENCY}::VARCHAR) ORDER BY "debtTimestamp" DESC`;
}
