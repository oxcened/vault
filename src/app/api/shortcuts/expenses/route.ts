import { NextResponse } from "next/server";
import { env } from "~/env";
import { db } from "~/server/db";
import { createTransaction as createTransactionRecord } from "~/server/services/transaction";
import {
  createTransactionSchema,
  type CreateTransaction,
} from "~/trpc/schemas/transaction";
import { shortcutExpenseDefaults } from "~/server/services/transaction";
import * as yup from "yup";

const requestSchema = yup.object({
  amount: yup.number().typeError("Amount must be a number").required(),
  currency: yup.string().trim().uppercase().required(),
  description: yup.string().trim().required(),
  timestamp: yup.date().typeError("Timestamp must be a valid date").optional(),
  date: yup.date().typeError("Date must be a valid date").optional(),
  category: yup.string().trim().optional(),
  categoryId: yup.string().trim().optional(),
});

function errorResponse(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function hasValidToken(request: Request) {
  const configuredToken = env.SHORTCUTS_API_TOKEN;
  if (!configuredToken) return false;

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${configuredToken}`;
}

async function resolveCategory(categoryIdOrName: string | undefined) {
  if (!categoryIdOrName) {
    return db.transactionCategory.findFirst({
      where: { name: "Other & Unexpected", type: "EXPENSE" },
      select: { id: true },
    });
  }

  return db.transactionCategory.findFirst({
    where: {
      type: "EXPENSE",
      OR: [
        { id: categoryIdOrName },
        { name: { equals: categoryIdOrName, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
}

export async function POST(request: Request) {
  if (!env.SHORTCUTS_API_TOKEN || !env.SHORTCUTS_USER_EMAIL) {
    return errorResponse("Shortcut expense import is not configured.", 404);
  }

  if (!hasValidToken(request)) {
    return errorResponse("Invalid Shortcut API token.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  try {
    const input = await requestSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const timestamp = input.timestamp ?? input.date ?? new Date();
    const category = await resolveCategory(input.categoryId ?? input.category);

    if (!category) {
      return errorResponse(
        input.category || input.categoryId
          ? "Expense category not found."
          : "Default expense category not found.",
        422,
      );
    }

    const transactionInput: CreateTransaction =
      await createTransactionSchema.validate({
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        timestamp,
        categoryId: category.id,
        ...shortcutExpenseDefaults,
      });

    const user = await db.user.findUnique({
      where: { email: env.SHORTCUTS_USER_EMAIL },
      select: { id: true },
    });
    if (!user) return errorResponse("Shortcut owner account not found.", 500);

    const transaction = await createTransactionRecord({
      db,
      input: transactionInput,
      userId: user.id,
    });

    return NextResponse.json({
      ok: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        description: transaction.description,
        timestamp: transaction.timestamp.toISOString(),
        type: transaction.type,
        status: transaction.status,
        categoryId: transaction.categoryId,
      },
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return errorResponse(error.errors.join(" "), 422);
    }

    console.error("Shortcut expense import failed", error);
    return errorResponse("Could not create expense transaction.", 500);
  }
}
