import { describe, expect, it } from "vitest";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "./transaction";
import { recurringTransactionSchema } from "./recurring-transaction";

const transaction = {
  currency: " eur ",
  amount: 12.34,
  timestamp: new Date("2026-02-01T12:00:00Z"),
  description: "  Grocery   shop  ",
  type: "EXPENSE",
  categoryId: "food",
  status: "POSTED",
};

describe("transaction validation", () => {
  it("normalizes currency and description", async () => {
    const result = await createTransactionSchema.validate(transaction);
    expect(result.currency).toBe("EUR");
    expect(result.description).toBe("Grocery shop");
  });
  it.each([
    ["EUR", 1.234],
    ["JPY", 1.1],
    ["BTC", 0.000000001],
  ])("rejects excess precision for %s", async (currency, amount) => {
    await expect(
      createTransactionSchema.validate({ ...transaction, currency, amount }),
    ).rejects.toThrow(/decimal places/);
  });
  it.each([
    ["EUR", 1.23],
    ["JPY", 123],
    ["BTC", 0.00000001],
  ])("accepts supported precision for %s", async (currency, amount) => {
    await expect(
      createTransactionSchema.validate({ ...transaction, currency, amount }),
    ).resolves.toMatchObject({ amount });
  });
  it("requires a valid date, category, type and status", async () => {
    for (const patch of [
      { timestamp: undefined },
      { categoryId: "" },
      { type: "INVALID" },
      { status: "INVALID" },
    ]) {
      await expect(
        createTransactionSchema.validate({ ...transaction, ...patch }),
      ).rejects.toThrow();
    }
  });
  it("allows partial updates while enforcing currency precision", async () => {
    await expect(
      updateTransactionSchema.validate({
        id: "a",
        description: "  Hello   world  ",
      }),
    ).resolves.toMatchObject({ description: "Hello world" });
    await expect(
      updateTransactionSchema.validate({
        id: "a",
        currency: "EUR",
        amount: 1.234,
      }),
    ).rejects.toThrow(/decimal places/);
  });
});

describe("recurring transaction validation", () => {
  const recurring = {
    ...transaction,
    nextDate: transaction.timestamp,
    frequency: "MONTHLY",
    interval: 1,
  };
  it("accepts a valid recurring transaction", async () => {
    await expect(
      recurringTransactionSchema.validate(recurring),
    ).resolves.toMatchObject({ interval: 1, frequency: "MONTHLY" });
  });
  it.each([0, -1, 1.5, 100])("rejects interval %s", async (interval) => {
    await expect(
      recurringTransactionSchema.validate({ ...recurring, interval }),
    ).rejects.toThrow();
  });
  it("rejects invalid frequencies and currency precision", async () => {
    await expect(
      recurringTransactionSchema.validate({
        ...recurring,
        frequency: "WEEKDAYS",
      }),
    ).rejects.toThrow();
    await expect(
      recurringTransactionSchema.validate({ ...recurring, amount: 1.234 }),
    ).rejects.toThrow(/decimal places/);
  });
});
