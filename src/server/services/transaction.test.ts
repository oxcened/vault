import { beforeEach, describe, expect, it, vi } from "vitest";
import { type PrismaClient } from "@prisma/client";
import { type CreateTransaction } from "~/trpc/schemas/transaction";

const emit = vi.hoisted(() => vi.fn());
vi.mock("~/server/eventBus", () => ({ appEmitter: { emit } }));
import { createTransaction } from "./transaction";

const input: CreateTransaction = {
  description: "Lunch",
  currency: "EUR",
  amount: 12.5,
  timestamp: new Date("2026-02-12T13:30:00Z"),
  categoryId: "food",
  type: "EXPENSE",
  status: "POSTED",
};
function setup(category: { type: string } | null) {
  const findUnique = vi.fn().mockResolvedValue(category);
  const create = vi
    .fn()
    .mockResolvedValue({ id: "transaction-1", timestamp: input.timestamp });
  const upsert = vi.fn().mockResolvedValue({});
  const transaction = vi.fn(
    async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({ transaction: { create }, exchangeRate: { upsert } }),
  );
  const db = {
    transactionCategory: { findUnique },
    $transaction: transaction,
  } as unknown as PrismaClient;
  return { db, findUnique, create, upsert, transaction };
}

beforeEach(() => emit.mockClear());
describe("createTransaction", () => {
  it("rejects a missing category without writing", async () => {
    const { db, transaction } = setup(null);
    await expect(
      createTransaction({ db, input, userId: "user-1" }),
    ).rejects.toThrow("Category not found");
    expect(transaction).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });
  it("rejects category and transaction type mismatches", async () => {
    const { db, transaction } = setup({ type: "INCOME" });
    await expect(
      createTransaction({ db, input, userId: "user-1" }),
    ).rejects.toThrow("income category");
    expect(transaction).not.toHaveBeenCalled();
  });
  it("saves a base currency transaction and emits an update", async () => {
    const { db, create, upsert } = setup({ type: "EXPENSE" });
    await createTransaction({ db, input, userId: "user-1" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 12.5,
          category: { connect: { id: "food" } },
          createdBy: { connect: { id: "user-1" } },
        }),
      }),
    );
    expect(upsert).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith("transaction:updated", {
      userId: "user-1",
      timestamp: input.timestamp,
    });
  });
  it("creates a daily exchange rate placeholder for foreign currency", async () => {
    const { db, upsert } = setup({ type: "EXPENSE" });
    await createTransaction({
      db,
      input: { ...input, currency: "usd" },
      userId: "user-1",
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          base_quote_timestamp: {
            baseCurrency: "USD",
            quoteCurrency: "EUR",
            timestamp: new Date("2026-02-12T00:00:00Z"),
          },
        },
        update: {},
        create: expect.objectContaining({ rate: 1 }),
      }),
    );
  });
  it("does not emit an update when the write fails", async () => {
    const { db, create } = setup({ type: "EXPENSE" });
    create.mockRejectedValue(new Error("write failed"));
    await expect(
      createTransaction({ db, input, userId: "user-1" }),
    ).rejects.toThrow("write failed");
    expect(emit).not.toHaveBeenCalled();
  });
});
