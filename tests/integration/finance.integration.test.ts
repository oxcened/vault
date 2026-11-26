import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/eventBus", () => ({ appEmitter: { emit: vi.fn() } }));
import { transactionRouter } from "~/server/api/routers/transaction";
import { netWorthAssetRouter } from "~/server/api/routers/netWorthAsset";
import { netWorthDebtRouter } from "~/server/api/routers/netWorthDebt";
import { envelopeRouter } from "~/server/api/routers/envelope";
import { recurringTransactionRouter } from "~/server/api/routers/recurringTransaction";
import { monthEndRouter } from "~/server/api/routers/monthEnd";

const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  new URL(url).hostname !== "127.0.0.1" ||
  new URL(url).pathname !== "/vault_test"
)
  throw new Error("Integration tests require the isolated vault_test database");
const db = new PrismaClient({ datasources: { db: { url } } });
const month = new Date("2024-03-01T00:00:00Z");
const timestamp = new Date("2024-03-15T12:00:00Z");
let alice = "",
  bob = "",
  expenseCategory = "",
  incomeCategory = "",
  holdingCategory = "";
const context = (id: string) => ({
  db,
  session: { user: { id }, expires: "2099-01-01" },
  headers: new Headers(),
});
const caller = <T>(router: { createCaller: (ctx: never) => T }, id: string) =>
  router.createCaller(context(id) as never);

beforeAll(async () => {
  alice = (
    await db.user.create({
      data: { email: "alice-integration@example.invalid" },
    })
  ).id;
  bob = (
    await db.user.create({ data: { email: "bob-integration@example.invalid" } })
  ).id;
  expenseCategory = (
    await db.transactionCategory.create({
      data: { name: "Integration expense", type: "EXPENSE" },
    })
  ).id;
  incomeCategory = (
    await db.transactionCategory.create({
      data: { name: "Integration income", type: "INCOME" },
    })
  ).id;
  holdingCategory = (
    await db.netWorthCategory.create({
      data: { name: "Integration holdings", type: "BOTH" },
    })
  ).id;
});
afterAll(async () => {
  await db.$disconnect();
});

describe("database-backed financial calculations", () => {
  it("recomputes posted cash flow after edits and deletion, with FX conversion and user isolation", async () => {
    await db.exchangeRate.create({
      data: {
        baseCurrency: "USD",
        quoteCurrency: "EUR",
        rate: 0.9,
        timestamp: month,
      },
    });
    await db.transaction.create({
      data: {
        createdById: alice,
        description: "Income",
        type: "INCOME",
        categoryId: incomeCategory,
        currency: "EUR",
        amount: 1000,
        timestamp,
        status: "POSTED",
      },
    });
    const expense = await db.transaction.create({
      data: {
        createdById: alice,
        description: "Expense",
        type: "EXPENSE",
        categoryId: expenseCategory,
        currency: "USD",
        amount: 100,
        timestamp,
        status: "POSTED",
      },
    });
    await db.transaction.create({
      data: {
        createdById: alice,
        description: "Planned",
        type: "EXPENSE",
        categoryId: expenseCategory,
        currency: "EUR",
        amount: 500,
        timestamp,
        status: "PLANNED",
      },
    });
    await db.transaction.create({
      data: {
        createdById: bob,
        description: "Other user",
        type: "INCOME",
        categoryId: incomeCategory,
        currency: "EUR",
        amount: 5000,
        timestamp,
        status: "POSTED",
      },
    });
    const recompute = async () => {
      await db.$executeRaw`SELECT update_cash_flow_for_user_month(${alice}::TEXT, ${month}::TIMESTAMP, 'EUR'::TEXT)`;
      return db.cashFlow.findUniqueOrThrow({
        where: {
          timestamp_createdById: { timestamp: month, createdById: alice },
        },
      });
    };
    let summary = await recompute();
    expect(summary.income.toNumber()).toBe(1000);
    expect(summary.expenses.toNumber()).toBe(90);
    expect(summary.netFlow.toNumber()).toBe(910);
    await db.transaction.update({
      where: { id: expense.id },
      data: { amount: 200 },
    });
    summary = await recompute();
    expect(summary.netFlow.toNumber()).toBe(820);
    await db.transaction.delete({ where: { id: expense.id } });
    summary = await recompute();
    expect(summary.netFlow.toNumber()).toBe(1000);
  });
  it("recomputes net worth after asset quantity changes", async () => {
    const asset = await db.netWorthAsset.create({
      data: {
        createdById: alice,
        categoryId: holdingCategory,
        name: "Savings",
        currency: "EUR",
      },
    });
    const quantity = await db.netWorthAssetQuantity.create({
      data: { netWorthAssetId: asset.id, timestamp: month, quantity: 1000 },
    });
    const debt = await db.netWorthDebt.create({
      data: {
        createdById: alice,
        categoryId: holdingCategory,
        name: "Loan",
        currency: "EUR",
      },
    });
    await db.netWorthDebtQuantity.create({
      data: { netWorthDebtId: debt.id, timestamp: month, quantity: 300 },
    });
    const recompute = async () => {
      await db.$executeRaw`SELECT update_net_worth_for_user_month(${alice}::TEXT, ${month}::TIMESTAMP, 'EUR'::TEXT)`;
      return db.netWorth.findFirstOrThrow({
        where: {
          createdById: alice,
          timestamp: new Date("2024-03-31T00:00:00Z"),
        },
      });
    };
    expect((await recompute()).netValue.toNumber()).toBe(700);
    await db.netWorthAssetQuantity.update({
      where: { id: quantity.id },
      data: { quantity: 1500 },
    });
    expect((await recompute()).netValue.toNumber()).toBe(1200);
  });
});

describe("user isolation", () => {
  it("prevents reading or changing another user's transactions, holdings, reserves and schedules", async () => {
    const transaction = await db.transaction.create({
      data: {
        createdById: bob,
        description: "Private",
        type: "EXPENSE",
        categoryId: expenseCategory,
        currency: "EUR",
        amount: 10,
        timestamp,
        status: "POSTED",
      },
    });
    const asset = await db.netWorthAsset.create({
      data: {
        createdById: bob,
        categoryId: holdingCategory,
        name: "Private asset",
        currency: "EUR",
      },
    });
    const assetQuantity = await db.netWorthAssetQuantity.create({
      data: { netWorthAssetId: asset.id, timestamp: month, quantity: 5 },
    });
    const debt = await db.netWorthDebt.create({
      data: {
        createdById: bob,
        categoryId: holdingCategory,
        name: "Private debt",
        currency: "EUR",
      },
    });
    const debtQuantity = await db.netWorthDebtQuantity.create({
      data: { netWorthDebtId: debt.id, timestamp: month, quantity: 5 },
    });
    const ownAsset = await db.netWorthAsset.create({
      data: {
        createdById: alice,
        categoryId: holdingCategory,
        name: "Own asset",
        currency: "EUR",
      },
    });
    const ownDebt = await db.netWorthDebt.create({
      data: {
        createdById: alice,
        categoryId: holdingCategory,
        name: "Own debt",
        currency: "EUR",
      },
    });
    const reserve = await db.envelope.create({
      data: {
        createdById: bob,
        name: "Private reserve",
        amount: 20,
        priority: 1,
      },
    });
    const schedule = await db.recurringTransaction.create({
      data: {
        createdById: bob,
        description: "Private schedule",
        type: "EXPENSE",
        categoryId: expenseCategory,
        currency: "EUR",
        amount: 10,
        nextDate: timestamp,
        frequency: "MONTHLY",
        interval: 1,
      },
    });
    await expect(
      caller(transactionRouter, alice).delete({ id: transaction.id }),
    ).rejects.toThrow();
    await expect(
      caller(netWorthAssetRouter, alice).delete({ id: asset.id }),
    ).rejects.toThrow();
    await expect(
      caller(netWorthDebtRouter, alice).delete({ id: debt.id }),
    ).rejects.toThrow();
    await expect(
      caller(envelopeRouter, alice).delete({ id: reserve.id }),
    ).rejects.toThrow();
    await expect(
      caller(recurringTransactionRouter, alice).skip({ id: schedule.id }),
    ).rejects.toThrow();
    await expect(
      caller(netWorthAssetRouter, alice).getValueHistory({ assetId: asset.id }),
    ).rejects.toThrow();
    await expect(
      caller(netWorthDebtRouter, alice).getValueHistory({ debtId: debt.id }),
    ).rejects.toThrow();
    expect(
      await caller(netWorthAssetRouter, alice).getQuantitiesByAssetId({
        assetId: asset.id,
      }),
    ).toEqual([]);
    expect(
      await caller(netWorthDebtRouter, alice).getQuantitiesByDebtId({
        debtId: debt.id,
      }),
    ).toEqual([]);
    await expect(
      caller(netWorthAssetRouter, alice).updateQuantity({
        assetId: ownAsset.id,
        id: assetQuantity.id,
        timestamp: new Date("2024-04-01T00:00:00Z"),
        quantity: "999",
      }),
    ).rejects.toThrow();
    await expect(
      caller(netWorthDebtRouter, alice).updateQuantity({
        debtId: ownDebt.id,
        id: debtQuantity.id,
        timestamp: new Date("2024-04-01T00:00:00Z"),
        quantity: "999",
      }),
    ).rejects.toThrow();
    expect(
      await db.netWorthAssetQuantity.findUnique({
        where: { id: assetQuantity.id },
      }),
    ).not.toBeNull();
  });
});

describe("month-end market data", () => {
  it("saves closing prices and exchange rates for the selected month", async () => {
    const ticker = await db.stockTicker.create({
      data: { ticker: "TEST", exchange: "TEST", name: "Integration stock" },
    });
    await caller(monthEndRouter, alice).save({
      month,
      stockPrices: [{ tickerId: ticker.id, value: 42 }],
      exchangeRates: [
        { baseCurrency: "GBP", quoteCurrency: "EUR", value: 1.2 },
      ],
    });
    const price = await db.stockPriceHistory.findFirstOrThrow({
      where: { tickerId: ticker.id },
    });
    const rate = await db.exchangeRate.findFirstOrThrow({
      where: { baseCurrency: "GBP", quoteCurrency: "EUR" },
    });
    expect(price.price.toNumber()).toBe(42);
    expect(price.isClosing).toBe(true);
    expect(rate.rate.toNumber()).toBe(1.2);
    expect(rate.isClosing).toBe(true);
    expect(price.timestamp.toISOString()).toBe("2024-03-31T00:00:00.000Z");
  });
  it("updates dependent valuations after closing prices and exchange rates change", async () => {
    const ticker = await db.stockTicker.create({
      data: { ticker: "FXTEST", exchange: "TEST", name: "FX stock" },
    });
    const asset = await db.netWorthAsset.create({
      data: {
        createdById: alice,
        categoryId: holdingCategory,
        name: "Foreign stock",
        currency: "USD",
        tickerId: ticker.id,
      },
    });
    await db.netWorthAssetQuantity.create({
      data: { netWorthAssetId: asset.id, timestamp: month, quantity: 10 },
    });
    const stock = await db.stockPriceHistory.create({
      data: { tickerId: ticker.id, timestamp: month, price: 10 },
    });
    const rate = await db.exchangeRate.findFirstOrThrow({
      where: { baseCurrency: "USD", quoteCurrency: "EUR", timestamp: month },
    });
    await db.$executeRaw`SELECT update_net_worth_for_user_month(${alice}::TEXT, ${month}::TIMESTAMP, 'EUR'::TEXT)`;
    const before = await db.netWorth.findFirstOrThrow({
      where: {
        createdById: alice,
        timestamp: new Date("2024-03-31T00:00:00Z"),
      },
    });
    await caller(monthEndRouter, alice).save({
      month,
      stockPrices: [{ tickerId: ticker.id, value: 20 }],
      exchangeRates: [
        { baseCurrency: "USD", quoteCurrency: "EUR", value: 1.1 },
      ],
    });
    await db.$executeRaw`SELECT recompute_derived_data_for_dependency('StockPrice'::TEXT, ${stock.id}::TEXT, 'EUR'::TEXT)`;
    await db.$executeRaw`SELECT recompute_derived_data_for_dependency('ExchangeRate'::TEXT, ${rate.id}::TEXT, 'EUR'::TEXT)`;
    const after = await db.netWorth.findFirstOrThrow({
      where: {
        createdById: alice,
        timestamp: new Date("2024-03-31T00:00:00Z"),
      },
    });
    expect(after.netValue.minus(before.netValue).toNumber()).toBe(130);
    const history = await caller(netWorthAssetRouter, alice).getValueHistory({
      assetId: asset.id,
    });
    expect(history.items[0]?.valueInTarget.toNumber()).toBe(220);
  });
});
