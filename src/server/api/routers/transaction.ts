import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "~/trpc/schemas/transaction";
import { APP_CURRENCY } from "~/constants";
import { appEmitter } from "~/server/eventBus";
import * as yup from "yup";

const ALLOWED_SORT_FIELDS = ["id", "timestamp"] as const;
type SortField = (typeof ALLOWED_SORT_FIELDS)[number];
const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;
type SortOrder = (typeof ALLOWED_SORT_ORDERS)[number];

export const transactionRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      yup.object({
        page: yup.number().integer().min(1).default(1),
        pageSize: yup.number().integer().min(1).max(100).default(20),
        query: yup.string().trim(),
        sortField: yup
          .string<SortField>()
          .oneOf(ALLOWED_SORT_FIELDS)
          .default("timestamp"),
        sortOrder: yup
          .string<SortOrder>()
          .oneOf(ALLOWED_SORT_ORDERS)
          .default("desc"),
        includeTotal: yup.boolean().default(true),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, query, sortField, sortOrder, includeTotal } =
        input;

      const where = {
        createdById: ctx.session.user.id,
        ...(query
          ? ({ description: { contains: query, mode: "insensitive" } } as const)
          : {}),
      };

      const [items, total] = await Promise.all([
        ctx.db.transaction.findMany({
          where,
          orderBy: [
            {
              [sortField]: sortOrder,
            },
          ],
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            amount: true,
            currency: true,
            timestamp: true,
            description: true,
            type: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        }),
        includeTotal
          ? ctx.db.transaction.count({ where })
          : Promise.resolve(undefined),
      ]);

      const totalPages =
        includeTotal && typeof total === "number"
          ? Math.max(1, Math.ceil(total / pageSize))
          : undefined;

      return {
        items,
        page,
        pageSize,
        total,
        totalPages,
        sortField,
        sortOrder,
      };
    }),

  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.$transaction(async (tx) => {
        const created = await tx.transaction.create({
          data: {
            timestamp: input.timestamp,
            amount: input.amount,
            currency: input.currency,
            description: input.description,
            type: input.type,
            category: { connect: { id: input.categoryId } },
            createdBy: { connect: { id: ctx.session.user.id } },
          },
        });

        if (input.currency.toUpperCase() !== APP_CURRENCY) {
          const date = new Date(input.timestamp);
          date.setUTCHours(0, 0, 0, 0);
          const newRate = 1;

          await tx.exchangeRate.upsert({
            where: {
              base_quote_timestamp: {
                baseCurrency: input.currency.toUpperCase(),
                quoteCurrency: APP_CURRENCY,
                timestamp: date,
              },
            },
            update: {},
            create: {
              baseCurrency: input.currency.toUpperCase(),
              quoteCurrency: APP_CURRENCY,
              rate: newRate,
              timestamp: date,
            },
          });
        }

        return created;
      });

      appEmitter.emit("transaction:updated", {
        userId: ctx.session.user.id,
        timestamp: result.timestamp,
      });

      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.transaction.delete({
        where: { id: input.id },
      });

      appEmitter.emit("transaction:updated", {
        userId: ctx.session.user.id,
        timestamp: deleted.timestamp,
      });

      return deleted;
    }),

  update: protectedProcedure
    .input(updateTransactionSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.transaction.update({
        where: { id: input.id },
        data: input,
      });

      appEmitter.emit("transaction:updated", {
        userId: ctx.session.user.id,
        timestamp: updated.timestamp,
      });

      return updated;
    }),
});
