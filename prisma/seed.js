import {
  NetWorthCategoryType,
  PrismaClient,
  RecurrenceFrequency,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";

const db = new PrismaClient();
const DEMO = "[Demo]";

/** @param {number} monthsAgo */
function monthStart(monthsAgo) {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1),
  );
}

async function findSeedUser() {
  const requestedEmail = process.env.SEED_USER_EMAIL;
  if (requestedEmail) {
    return db.user.findUnique({ where: { email: requestedEmail } });
  }

  const users = await db.user.findMany({ take: 2, orderBy: { id: "asc" } });
  if (users.length === 1) return users[0];
  if (users.length === 0) {
    throw new Error(
      "No user exists. Sign in once, then run npm run db:seed again.",
    );
  }
  throw new Error(
    "Multiple users exist. Set SEED_USER_EMAIL to choose which account to seed.",
  );
}

async function main() {
  const user = await findSeedUser();
  if (!user) throw new Error("SEED_USER_EMAIL does not match a local user.");

  await db.$transaction([
    db.transaction.deleteMany({
      where: { createdById: user.id, description: { startsWith: DEMO } },
    }),
    db.recurringTransaction.deleteMany({
      where: { createdById: user.id, description: { startsWith: DEMO } },
    }),
    db.transactionTemplate.deleteMany({
      where: { createdById: user.id, description: { startsWith: DEMO } },
    }),
    db.envelope.deleteMany({
      where: { createdById: user.id, name: { startsWith: DEMO } },
    }),
    db.netWorthAsset.deleteMany({
      where: { createdById: user.id, name: { startsWith: DEMO } },
    }),
    db.netWorthDebt.deleteMany({
      where: { createdById: user.id, name: { startsWith: DEMO } },
    }),
  ]);

  const transactionCategoryList = await db.transactionCategory.findMany({
    orderBy: { createdAt: "asc" },
  });
  if (transactionCategoryList.length === 0) {
    throw new Error(
      "No transaction categories exist. Apply the database migrations before seeding.",
    );
  }
  const transactionCategories = Object.fromEntries(
    transactionCategoryList.map((category) => [category.name, category]),
  );

  /** @param {string} name */
  const requireTransactionCategory = (name) => {
    const category = transactionCategories[name];
    if (!category) {
      throw new Error(
        `Required transaction category "${name}" is missing. Apply the database migrations before seeding.`,
      );
    }
    return category;
  };

  const assetCategory = await db.netWorthCategory.upsert({
    where: { name: "Cash & investments" },
    update: { type: NetWorthCategoryType.ASSET },
    create: { name: "Cash & investments", type: NetWorthCategoryType.ASSET },
  });
  const stockCategory = await db.netWorthCategory.upsert({
    where: { name: "Stocks & ETFs" },
    update: { type: NetWorthCategoryType.ASSET, isStock: true },
    create: {
      name: "Stocks & ETFs",
      type: NetWorthCategoryType.ASSET,
      isStock: true,
    },
  });
  const debtCategory = await db.netWorthCategory.upsert({
    where: { name: "Loans" },
    update: { type: NetWorthCategoryType.DEBT },
    create: { name: "Loans", type: NetWorthCategoryType.DEBT },
  });

  const checking = await db.netWorthAsset.create({
    data: {
      name: `${DEMO} Checking account`,
      currency: "EUR",
      isLiquid: true,
      categoryId: assetCategory.id,
      createdById: user.id,
    },
  });
  const investments = await db.netWorthAsset.create({
    data: {
      name: `${DEMO} Investment portfolio`,
      currency: "EUR",
      categoryId: assetCategory.id,
      createdById: user.id,
    },
  });
  const appleTicker = await db.stockTicker.upsert({
    where: { ticker_exchange: { ticker: "AAPL", exchange: "NASDAQ" } },
    update: { providerSymbol: "AAPL", autoUpdate: true },
    create: {
      ticker: "AAPL",
      exchange: "NASDAQ",
      name: "Apple Inc.",
      providerSymbol: "AAPL",
      autoUpdate: true,
    },
  });
  const microsoftTicker = await db.stockTicker.upsert({
    where: { ticker_exchange: { ticker: "MSFT", exchange: "NASDAQ" } },
    update: { providerSymbol: "MSFT", autoUpdate: true },
    create: {
      ticker: "MSFT",
      exchange: "NASDAQ",
      name: "Microsoft Corporation",
      providerSymbol: "MSFT",
      autoUpdate: true,
    },
  });
  const apple = await db.netWorthAsset.create({
    data: {
      name: `${DEMO} Apple shares`,
      currency: "USD",
      categoryId: stockCategory.id,
      tickerId: appleTicker.id,
      createdById: user.id,
    },
  });
  const microsoft = await db.netWorthAsset.create({
    data: {
      name: `${DEMO} Microsoft shares`,
      currency: "USD",
      categoryId: stockCategory.id,
      tickerId: microsoftTicker.id,
      createdById: user.id,
    },
  });
  const loan = await db.netWorthDebt.create({
    data: {
      name: `${DEMO} Car loan`,
      currency: "EUR",
      categoryId: debtCategory.id,
      createdById: user.id,
    },
  });

  /** @type {Record<string, [string, number]>} */
  const categoryExamples = {
    Housing: ["Rent", 1150],
    "Personal Care": ["Haircut", 38],
    "Groceries & Household": ["Weekly groceries", 92],
    "Transport & Mobility": ["Public transport pass", 68],
    "Eating Out & Bars": ["Dinner with friends", 54],
    "Travel & Holidays": ["Weekend train tickets", 120],
    Shopping: ["New jacket", 85],
    "Leisure & Entertainment": ["Cinema tickets", 28],
    "Gifts & Donations": ["Birthday gift", 45],
    "Financial Fees & Charges": ["Account fee", 6],
    "Taxes & Contributions": ["Local tax payment", 210],
    "Other & Unexpected": ["Unexpected repair", 135],
    "Salary & Wages": ["Monthly salary", 3400],
    "Freelance & Side Hustles": ["Freelance project", 475],
    "Business Income": ["Client payment", 900],
    "Investments & Dividends": ["Quarterly dividend", 75],
    "Pension & Retirement Income": ["Pension payment", 1200],
    "Rental Income": ["Monthly rental income", 850],
    "Internal Transfer": ["Move to emergency fund", 300],
    "Interbank Transfer": ["Transfer between banks", 250],
    "Checking to Savings": ["Monthly savings", 500],
    "Savings to Checking": ["Top up checking account", 200],
    "Credit Card Payment": ["Pay credit card balance", 640],
    "Investment Transfer": ["Fund investment account", 400],
    "Wire Transfer": ["Wire transfer", 275],
    "ACH Transfer": ["ACH transfer", 180],
  };

  const transactions = transactionCategoryList.map((category, index) => {
    const fallbackAmount =
      category.type === TransactionType.INCOME
        ? 500
        : category.type === TransactionType.TRANSFER
          ? 250
          : 50;
    const [description, amount] = categoryExamples[category.name] ?? [
      category.name,
      fallbackAmount,
    ];

    return {
      description: `${DEMO} ${description}`,
      amount,
      currency: "EUR",
      type: category.type,
      status: TransactionStatus.POSTED,
      categoryId: category.id,
      createdById: user.id,
      timestamp: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
    };
  });

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo -= 1) {
    const timestamp = monthStart(monthsAgo);
    const monthVariation = (11 - monthsAgo) * 35;
    /** @type {Array<[string, number, string, import("@prisma/client").TransactionType, number]>} */
    const rows = [
      [
        "Monthly salary",
        3400 + monthVariation,
        "Salary & Wages",
        TransactionType.INCOME,
        2,
      ],
      [
        "Freelance project",
        350 + (monthsAgo % 3) * 125,
        "Freelance & Side Hustles",
        TransactionType.INCOME,
        8,
      ],
      ["Rent", 1150, "Housing", TransactionType.EXPENSE, 3],
      [
        "Groceries & Household",
        420 + (monthsAgo % 4) * 18,
        "Groceries & Household",
        TransactionType.EXPENSE,
        12,
      ],
      [
        "Public transport",
        68,
        "Transport & Mobility",
        TransactionType.EXPENSE,
        15,
      ],
      [
        "Dinner and cinema",
        95 + (monthsAgo % 2) * 25,
        "Leisure & Entertainment",
        TransactionType.EXPENSE,
        21,
      ],
    ];

    for (const [description, amount, category, type, day] of rows) {
      transactions.push({
        description: `${DEMO} ${description}`,
        amount,
        currency: "EUR",
        type,
        status: TransactionStatus.POSTED,
        categoryId: requireTransactionCategory(category).id,
        createdById: user.id,
        timestamp: new Date(
          Date.UTC(timestamp.getUTCFullYear(), timestamp.getUTCMonth(), day),
        ),
      });
    }

    const checkingValue = 4500 + (11 - monthsAgo) * 525;
    const investmentValue = 12000 + (11 - monthsAgo) * 640;
    const loanValue = 9200 - (11 - monthsAgo) * 420;
    const appleQuantity = 18 + Math.floor((11 - monthsAgo) / 4);
    const microsoftQuantity = 10 + Math.floor((11 - monthsAgo) / 6);
    const applePrice = 178 + (11 - monthsAgo) * 3.4 + (monthsAgo % 3) * 2;
    const microsoftPrice = 365 + (11 - monthsAgo) * 7.2 - (monthsAgo % 4) * 3;
    const usdToEur = 0.91 + (monthsAgo % 4) * 0.008;
    await db.$transaction([
      db.netWorthAssetQuantity.create({
        data: {
          netWorthAssetId: checking.id,
          quantity: checkingValue,
          timestamp,
        },
      }),
      db.netWorthAssetQuantity.create({
        data: {
          netWorthAssetId: apple.id,
          quantity: appleQuantity,
          timestamp,
        },
      }),
      db.netWorthAssetQuantity.create({
        data: {
          netWorthAssetId: microsoft.id,
          quantity: microsoftQuantity,
          timestamp,
        },
      }),
      db.stockPriceHistory.upsert({
        where: {
          ticker_timestamp: { tickerId: appleTicker.id, timestamp },
        },
        update: {},
        create: { tickerId: appleTicker.id, price: applePrice, timestamp },
      }),
      db.stockPriceHistory.upsert({
        where: {
          ticker_timestamp: { tickerId: microsoftTicker.id, timestamp },
        },
        update: {},
        create: {
          tickerId: microsoftTicker.id,
          price: microsoftPrice,
          timestamp,
        },
      }),
      db.exchangeRate.upsert({
        where: {
          base_quote_timestamp: {
            baseCurrency: "USD",
            quoteCurrency: "EUR",
            timestamp,
          },
        },
        update: {},
        create: {
          baseCurrency: "USD",
          quoteCurrency: "EUR",
          rate: usdToEur,
          timestamp,
        },
      }),
      db.netWorthAssetQuantity.create({
        data: {
          netWorthAssetId: investments.id,
          quantity: investmentValue,
          timestamp,
        },
      }),
      db.netWorthDebtQuantity.create({
        data: { netWorthDebtId: loan.id, quantity: loanValue, timestamp },
      }),
    ]);
  }

  await db.transaction.createMany({ data: transactions });

  /** @param {number} daysFromToday */
  const scheduleDate = (daysFromToday) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + daysFromToday);
    return date;
  };
  await db.recurringTransaction.createMany({
    data: [
      {
        description: `${DEMO} Rent`,
        amount: 1150,
        currency: "EUR",
        type: TransactionType.EXPENSE,
        categoryId: requireTransactionCategory("Housing").id,
        nextDate: scheduleDate(-2),
        frequency: RecurrenceFrequency.MONTHLY,
        createdById: user.id,
      },
      {
        description: `${DEMO} Music subscription`,
        amount: 11,
        currency: "EUR",
        type: TransactionType.EXPENSE,
        categoryId: requireTransactionCategory("Leisure & Entertainment").id,
        nextDate: scheduleDate(5),
        frequency: RecurrenceFrequency.MONTHLY,
        createdById: user.id,
      },
      {
        description: `${DEMO} Salary`,
        amount: 3750,
        currency: "EUR",
        type: TransactionType.INCOME,
        categoryId: requireTransactionCategory("Salary & Wages").id,
        nextDate: scheduleDate(10),
        frequency: RecurrenceFrequency.MONTHLY,
        createdById: user.id,
      },
      {
        description: `${DEMO} Gym membership`,
        amount: 35,
        currency: "EUR",
        type: TransactionType.EXPENSE,
        categoryId: requireTransactionCategory("Personal Care").id,
        nextDate: scheduleDate(14),
        frequency: RecurrenceFrequency.MONTHLY,
        isPaused: true,
        createdById: user.id,
      },
    ],
  });

  await db.transactionTemplate.createMany({
    data: [
      {
        description: `${DEMO} Groceries`,
        amount: 80,
        currency: "EUR",
        type: TransactionType.EXPENSE,
        categoryId: requireTransactionCategory("Groceries & Household").id,
        createdById: user.id,
      },
      {
        description: `${DEMO} Freelance invoice`,
        amount: 500,
        currency: "EUR",
        type: TransactionType.INCOME,
        categoryId: requireTransactionCategory("Freelance & Side Hustles").id,
        createdById: user.id,
      },
    ],
  });

  await db.envelope.createMany({
    data: [
      {
        name: `${DEMO} Emergency fund`,
        target: 10000,
        amount: 5200,
        priority: 1,
        createdById: user.id,
      },
      {
        name: `${DEMO} Holiday`,
        target: 2500,
        amount: 900,
        priority: 2,
        createdById: user.id,
      },
      {
        name: `${DEMO} New laptop`,
        target: 1800,
        amount: 650,
        priority: 3,
        createdById: user.id,
      },
    ],
  });

  const historyStart = monthStart(11);
  await db.$executeRaw`SELECT recompute_net_worth_for_user_from(${user.id}::TEXT, ${historyStart}::DATE, 'EUR'::VARCHAR)`;
  await db.$executeRaw`SELECT recompute_cash_flow_for_user_from(${user.id}::TEXT, ${historyStart}::DATE, 'EUR'::VARCHAR)`;

  console.log(`Seeded demo data for ${user.email ?? user.id}:`);
  console.log(
    `  ${transactions.length} transactions, 12 months of history, 5 holdings`,
  );
  console.log("  2 stock tickers with monthly prices and EUR exchange rates");
  console.log("  3 envelopes and 2 transaction templates");
  console.log("  4 recurring schedules");
}

async function run() {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

void run();
