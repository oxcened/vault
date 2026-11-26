import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecurrenceFrequency } from "@prisma/client";

const emit = vi.hoisted(() => vi.fn());
vi.mock("~/server/eventBus", () => ({ appEmitter: { emit } }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
import { recurringTransactionRouter } from "./recurringTransaction";

const owner = "user-1";
const schedule = {
  id: "schedule-1",
  createdById: owner,
  description: "Rent",
  amount: 1000,
  currency: "EUR",
  type: "EXPENSE",
  categoryId: "housing",
  nextDate: new Date("2024-01-31T12:00:00Z"),
  frequency: RecurrenceFrequency.MONTHLY as RecurrenceFrequency,
  interval: 1,
};
function setup(overrides: Partial<typeof schedule> = {}) {
  const current = { ...schedule, ...overrides };
  const findFirstOrThrow = vi.fn().mockResolvedValue(current);
  const update = vi.fn().mockResolvedValue({});
  const remove = vi.fn().mockResolvedValue({});
  const create = vi.fn(async ({ data }: { data: { timestamp: Date } }) => ({
    id: "transaction-1",
    timestamp: data.timestamp,
  }));
  const tx = {
    recurringTransaction: { findFirstOrThrow, update, delete: remove },
    transaction: { create },
  };
  const db = {
    ...tx,
    $transaction: vi.fn(
      async (callback: (transactionClient: typeof tx) => Promise<unknown>) =>
        callback(tx),
    ),
  };
  const context = {
    db,
    session: { user: { id: owner }, expires: "2099-01-01" },
    headers: new Headers(),
  } as unknown as Parameters<typeof recurringTransactionRouter.createCaller>[0];
  return {
    caller: recurringTransactionRouter.createCaller(context),
    findFirstOrThrow,
    update,
    remove,
    create,
  };
}
beforeEach(() => emit.mockClear());

describe("scheduled transactions", () => {
  it("advances a monthly schedule from January 31 to leap-day February", async () => {
    const { caller, findFirstOrThrow, update } = setup();
    await caller.skip({ id: schedule.id });
    expect(findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: schedule.id, createdById: owner },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: schedule.id },
      data: { nextDate: new Date("2024-02-29T12:00:00Z") },
    });
  });
  it("deletes a one-time schedule when skipped", async () => {
    const { caller, remove, update } = setup({
      frequency: RecurrenceFrequency.ONCE,
    });
    await caller.skip({ id: schedule.id });
    expect(remove).toHaveBeenCalledWith({ where: { id: schedule.id } });
    expect(update).not.toHaveBeenCalled();
  });
  it("posts a due transaction on its scheduled date and advances it", async () => {
    const { caller, create, update } = setup();
    await caller.post({ id: schedule.id });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        timestamp: schedule.nextDate,
        status: "POSTED",
        createdById: owner,
      }),
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: schedule.id },
      data: { nextDate: new Date("2024-02-29T12:00:00Z") },
    });
    expect(emit).toHaveBeenCalledWith("transaction:updated", {
      userId: owner,
      timestamp: schedule.nextDate,
    });
  });
  it("posts and removes a one-time schedule", async () => {
    const { caller, remove, update } = setup({
      frequency: RecurrenceFrequency.ONCE,
    });
    await caller.post({ id: schedule.id });
    expect(remove).toHaveBeenCalledWith({ where: { id: schedule.id } });
    expect(update).not.toHaveBeenCalled();
  });
  it("does not advance or emit when transaction creation fails", async () => {
    const { caller, create, update } = setup();
    create.mockRejectedValue(new Error("write failed"));
    await expect(caller.post({ id: schedule.id })).rejects.toThrow(
      "write failed",
    );
    expect(update).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });
});
