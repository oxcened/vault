import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { APP_CURRENCY } from "~/constants";

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

export async function updateFromDate({
  db,
  date,
  createdBy,
}: {
  db: Pick<PrismaClient, "$queryRaw" | "netWorth">;
  date: Date;
  createdBy: string;
}) {
  return db.$queryRaw`CALL updateFromDate(${date}, ${APP_CURRENCY}, ${createdBy})`;
}

export const netWorthRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.netWorth.findMany({
      orderBy: { timestamp: "desc" },
    });
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
  updateFromDate: protectedProcedure
    .input(
      z.object({
        date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return updateFromDate({
        db: ctx.db,
        date: input.date,
        createdBy: ctx.session.user.id,
      });
    }),
});
