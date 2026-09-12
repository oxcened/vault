import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  createShortcutApiToken,
  hashShortcutApiToken,
} from "~/server/utils/shortcut-api-token";

export const shortcutApiTokenRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) =>
    ctx.db.shortcutApiToken.findMany({
      where: { createdById: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ),

  create: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const token = createShortcutApiToken();
      const apiToken = await ctx.db.shortcutApiToken.create({
        data: {
          name: input.name,
          tokenHash: hashShortcutApiToken(token),
          createdById: ctx.session.user.id,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          lastUsedAt: true,
        },
      });

      return { apiToken, token };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db.shortcutApiToken.deleteMany({
        where: { id: input.id, createdById: ctx.session.user.id },
      });

      return { count: deleted.count };
    }),
});
