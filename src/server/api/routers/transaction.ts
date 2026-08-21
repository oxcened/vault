import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "~/trpc/schemas/transaction";
import { APP_CURRENCY } from "~/constants";
import { appEmitter } from "~/server/eventBus";
import * as yup from "yup";
import { TransactionStatus, TransactionType } from "@prisma/client";
import type { Prisma, TransactionCategoryType } from "@prisma/client";
import { DECIMAL_ZERO } from "~/utils/number";

const ALLOWED_SORT_FIELDS = ["id", "timestamp"] as const;
export type SortField = (typeof ALLOWED_SORT_FIELDS)[number];
const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;
type SortOrder = (typeof ALLOWED_SORT_ORDERS)[number];

export const transactionRouter = createTRPCRouter({
  descriptionSuggestions: protectedProcedure
    .input(
      z.object({
        query: z.string().trim().min(1),
        type: z.nativeEnum(TransactionType),
      }),
    )
    .query(async ({ ctx, input }) => {
      const matches = await ctx.db.transaction.findMany({
        where: {
          createdById: ctx.session.user.id,
          description: { contains: input.query, mode: "insensitive" },
          type: input.type,
        },
        orderBy: [{ timestamp: "desc" }, { updatedAt: "desc" }],
        take: 100,
        select: {
          description: true,
          categoryId: true,
          category: { select: { name: true } },
          timestamp: true,
        },
      });

      const uniqueMatches = new Map<
        string,
        (typeof matches)[number] & { count: number }
      >();

      for (const match of matches) {
        const key = match.description.trim().toLocaleLowerCase();
        const existing = uniqueMatches.get(key);
        if (existing) existing.count += 1;
        else uniqueMatches.set(key, { ...match, count: 1 });
      }

      const normalizedQuery = input.query.toLocaleLowerCase();

      return [...uniqueMatches.values()]
        .sort((left, right) => {
          const leftStartsWith = left.description
            .toLocaleLowerCase()
            .startsWith(normalizedQuery);
          const rightStartsWith = right.description
            .toLocaleLowerCase()
            .startsWith(normalizedQuery);

          if (leftStartsWith !== rightStartsWith)
            return leftStartsWith ? -1 : 1;
          if (left.count !== right.count) return right.count - left.count;
          return right.timestamp.getTime() - left.timestamp.getTime();
        })
        .slice(0, 5)
        .map((match) => ({
          description: match.description,
          categoryId: match.categoryId,
          categoryName: match.category.name,
        }));
    }),

  suggestCategory: protectedProcedure
    .input(
      z.object({
        description: z.string().trim().min(1),
        type: z.nativeEnum(TransactionType),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.transaction.findFirst({
        where: {
          createdById: ctx.session.user.id,
          description: {
            equals: input.description,
            mode: "insensitive",
          },
          type: input.type,
        },
        orderBy: [{ timestamp: "desc" }, { updatedAt: "desc" }],
        select: {
          categoryId: true,
          category: {
            select: { name: true },
          },
        },
      });
    }),

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
        types: yup
          .array(
            yup
              .string<TransactionType>()
              .required()
              .oneOf(Object.values(TransactionType)),
          )
          .optional(),
        statuses: yup
          .array(
            yup
              .string<TransactionStatus>()
              .required()
              .oneOf(Object.values(TransactionStatus)),
          )
          .optional(),
        timestampFrom: yup.date().optional(),
        timestampTo: yup.date().optional(),
        categoryIds: yup.array(yup.string().required()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        query,
        sortField,
        sortOrder,
        includeTotal,
        categoryIds,
      } = input;

      const where = {
        createdById: ctx.session.user.id,
        ...(query
          ? ({ description: { contains: query, mode: "insensitive" } } as const)
          : {}),
        type: {
          in: input.types,
        },
        status: {
          in: input.statuses,
        },
        timestamp: {
          gte: input.timestampFrom,
          lte: input.timestampTo,
        },
        ...(categoryIds && categoryIds.length > 0
          ? { categoryId: { in: categoryIds } }
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
            status: true,
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
            status: input.status,
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

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string()).min(1).max(100) }))
    .mutation(async ({ input, ctx }) => {
      const transactions = await ctx.db.transaction.findMany({
        where: {
          id: { in: input.ids },
          createdById: ctx.session.user.id,
        },
        select: { id: true, timestamp: true },
      });

      await ctx.db.transaction.deleteMany({
        where: { id: { in: transactions.map(({ id }) => id) } },
      });

      const affectedMonths = new Map<string, Date>();
      for (const transaction of transactions) {
        const timestamp = transaction.timestamp;
        const key = `${timestamp.getUTCFullYear()}-${timestamp.getUTCMonth()}`;
        affectedMonths.set(key, timestamp);
      }
      for (const timestamp of affectedMonths.values()) {
        appEmitter.emit("transaction:updated", {
          userId: ctx.session.user.id,
          timestamp,
        });
      }

      return { count: transactions.length };
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

  aggregateByCategory: protectedProcedure
    .input(
      yup.object({
        fromDate: yup.date().required(),
        toDate: yup.date().required(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const fromDate = input.fromDate;
      const toDate = input.toDate;

      const [rangeStart, rangeEnd] =
        fromDate <= toDate ? [fromDate, toDate] : [toDate, fromDate];

      const groupedByCategory = await ctx.db.transaction.groupBy({
        by: ["categoryId"],
        where: {
          createdById: ctx.session.user.id,
          timestamp: {
            gte: rangeStart,
            lte: rangeEnd,
          },
          status: TransactionStatus.POSTED,
        },
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
      });

      if (!groupedByCategory.length) {
        return [];
      }

      const categories = await ctx.db.transactionCategory.findMany({
        where: {
          id: {
            in: groupedByCategory.map((group) => group.categoryId),
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
      });

      const categoryById = new Map(
        categories.map((category) => [category.id, category]),
      );

      type CategoryAggregate = {
        categoryId: string;
        categoryName: string;
        categoryType: TransactionCategoryType;
        totalAmount: Prisma.Decimal;
        transactionCount: number;
      };

      return groupedByCategory
        .map<CategoryAggregate | null>((group) => {
          const category = categoryById.get(group.categoryId);

          if (!category) {
            return null;
          }

          return {
            categoryId: category.id,
            categoryName: category.name,
            categoryType: category.type,
            totalAmount: group._sum.amount ?? DECIMAL_ZERO,
            transactionCount: group._count?._all ?? 0,
          };
        })
        .filter((group): group is CategoryAggregate => Boolean(group))
        .sort((a, b) => {
          return b.totalAmount.abs().minus(a.totalAmount.abs()).toNumber();
        });
    }),
});
