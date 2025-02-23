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
    getNetWorth(date, date, APP_CURRENCY, date, APP_CURRENCY),
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
    getNetWorth(date, date, APP_CURRENCY, date, APP_CURRENCY),
  );

  // Extract the computed net worth (defaulting to 0 if no value is returned)
  const netWorth = netWorthResult[0]?.netWorth ?? 0;

  // Upsert a NetWorth record using the unique timestamp.
  return db.netWorth.upsert({
    where: { timestamp: date },
    update: { value: netWorth },
    create: { value: netWorth, timestamp: date },
  });
}

export async function updateFromDate({
  db,
  date,
}: {
  db: Pick<PrismaClient, "$queryRawTyped" | "netWorth">;
  date: Date;
}) {
  // Normalize the provided date to midnight.
  const startDate = new Date(date);
  startDate.setUTCHours(0, 0, 0, 0);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const results: NetWorth[] = [];

  // Loop over each day from startDate to today (inclusive).
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    // Create a copy of the current day.
    const currentDay = new Date(d);

    // Query net worth computed from data available up to the current day.
    const netWorthResult = await db.$queryRawTyped(
      getNetWorth(
        currentDay,
        currentDay,
        APP_CURRENCY,
        currentDay,
        APP_CURRENCY,
      ),
    );
    const netWorth = netWorthResult[0]?.netWorth ?? 0;

    // Upsert the NetWorth record for the current day.
    const record = await db.netWorth.upsert({
      where: { timestamp: currentDay },
      update: { value: netWorth },
      create: { value: netWorth, timestamp: currentDay },
    });

    results.push(record);
  }

  return results;
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
