import { NetWorth, PrismaClient } from "@prisma/client";
import { getNetWorth } from "@prisma/client/sql";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { APP_CURRENCY } from "~/constants";

export async function computeByDate({
  db,
  date,
}: {
  db: Pick<PrismaClient, "$queryRawTyped">;
  date: Date;
}) {
  date.setUTCHours(0, 0, 0, 0);

  return db.$queryRawTyped(
    getNetWorth(
      date,
      date,
      date,
      APP_CURRENCY,
      date,
      APP_CURRENCY,
      APP_CURRENCY,
    ),
  );
}

export async function getByDate({
  db,
  date,
}: {
  db: Pick<PrismaClient, "netWorth">;
  date: Date;
}) {
  date.setUTCHours(0, 0, 0, 0);

  return db.netWorth.findFirst({
    where: {
      timestamp: date,
    },
  });
}

export async function getLatest({
  db,
}: {
  db: Pick<PrismaClient, "netWorth">;
}) {
  return db.netWorth.findFirst({
    orderBy: {
      timestamp: "desc",
    },
  });
}

export async function updateByDate({
  db,
  date,
}: {
  db: Pick<PrismaClient, "$queryRawTyped" | "netWorth">;
  date: Date;
}) {
  date.setUTCHours(0, 0, 0, 0);

  const netWorthResult = await db.$queryRawTyped(
    getNetWorth(
      date,
      date,
      date,
      APP_CURRENCY,
      date,
      APP_CURRENCY,
      APP_CURRENCY,
    ),
  );

  // Extract the computed net worth (defaulting to 0 if no value is returned)
  const netValue = netWorthResult[0]?.netWorth ?? 0;
  const totalAssets = netWorthResult[0]?.totalAssets ?? 0;
  const totalDebts = netWorthResult[0]?.totalDebts ?? 0;

  // Upsert a NetWorth record using the unique timestamp.
  return db.netWorth.upsert({
    where: { timestamp: date },
    update: { netValue, totalAssets, totalDebts },
    create: { netValue, totalAssets, totalDebts, timestamp: date },
  });
}

export async function updateFromDate({
  db,
  date,
}: {
  db: Pick<PrismaClient, "$queryRaw" | "netWorth">;
  date: Date;
}) {
  return db.$queryRaw`CALL updateFromDate(${date}, 'EUR')`;
}

export const netWorthRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.netWorth.findMany({
      orderBy: { timestamp: "desc" },
    });
  }),
  computeByDate: protectedProcedure
    .input(
      z.object({
        date: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return computeByDate({ db: ctx.db, date: input.date });
    }),
  getByDate: protectedProcedure
    .input(
      z.object({
        date: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getByDate({ db: ctx.db, date: input.date });
    }),
  getLatest: protectedProcedure.query(async ({ ctx }) => {
    return getLatest({ db: ctx.db });
  }),
  updateByDate: protectedProcedure
    .input(
      z.object({
        date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return updateByDate({ db: ctx.db, date: input.date });
    }),
  updateFromDate: protectedProcedure
    .input(
      z.object({
        date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return updateFromDate({ db: ctx.db, date: input.date });
    }),
});
