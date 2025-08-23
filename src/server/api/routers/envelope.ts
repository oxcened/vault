import { Envelope } from "@prisma/client";
import Decimal from "decimal.js";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getAssetValuesForUserMonth } from "~/server/utils/db";
import {
  createEnvelopeSchema,
  updateEnvelopeSchema,
} from "~/trpc/schemas/envelope";
import { DECIMAL_ZERO } from "~/utils/number";

export const envelopeRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const assets = await getAssetValuesForUserMonth({
      db: ctx.db,
      startDate: new Date(),
      userId: ctx.session.user.id,
    });

    const poolAmount = assets
      .filter((asset) => asset.poolInEnvelopes)
      .reduce((prev, curr) => prev.plus(curr.valueInTarget), DECIMAL_ZERO);

    const envelopes = await ctx.db.envelope.findMany({
      orderBy: { priority: "asc" },
      where: {
        createdById: ctx.session.user.id,
      },
    });

    let remaining = new Decimal(poolAmount);
    const resultEnvelops: (Envelope & {
      funded?: Decimal;
      isFull?: boolean;
      shortfall?: Decimal;
    })[] = [...envelopes];

    for (const envelope of resultEnvelops) {
      envelope.funded = Decimal.min(envelope.target, remaining);
      envelope.isFull = envelope.funded.eq(envelope.target);
      envelope.shortfall = envelope.isFull
        ? undefined
        : envelope.target.minus(envelope.funded);

      remaining = remaining.minus(envelope.funded);
    }

    return {
      envelopes: resultEnvelops,
      pool: poolAmount,
      remaining,
    };
  }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.envelope.delete({
        where: { id: input.id, createdById: ctx.session.user.id },
      });

      return deleted;
    }),
  create: protectedProcedure
    .input(createEnvelopeSchema)
    .mutation(async ({ input, ctx }) => {
      const highestPriority = await ctx.db.envelope.aggregate({
        _max: {
          priority: true,
        },
      });

      return ctx.db.envelope.create({
        data: {
          ...input,
          createdBy: { connect: { id: ctx.session.user.id } },
          priority: (highestPriority._max.priority ?? 0) + 1,
        },
      });
    }),
  update: protectedProcedure
    .input(updateEnvelopeSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.envelope.update({
        where: { id: input.id, createdById: ctx.session.user.id },
        data: {
          target: input.target,
          name: input.name,
        },
      });

      return updated;
    }),

  reorder: protectedProcedure
    .input(z.object({ orderedIds: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(async (tx) => {
        const count = await tx.envelope.count({
          where: {
            createdById: ctx.session.user.id,
            id: { in: input.orderedIds },
          },
        });

        if (count !== input.orderedIds.length) {
          throw new Error("Some items are missing from your list.");
        }

        for (let i = 0; i < input.orderedIds.length; i++) {
          await tx.envelope.update({
            where: {
              id: input.orderedIds[i],
              createdById: ctx.session.user.id,
            },
            data: { priority: i + 1 },
          });
        }
      });
    }),
});
