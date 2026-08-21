import {
  NetWorthCategoryType,
  PrismaClient,
  TransactionCategoryType,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";

const db = new PrismaClient();
const DEMO = "[Demo]";

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

  const categorySpecs = [
    ["Salary", TransactionCategoryType.INCOME],
    ["Freelance", TransactionCategoryType.INCOME],
    ["Housing", TransactionCategoryType.EXPENSE],
    ["Groceries", TransactionCategoryType.EXPENSE],
    ["Transport", TransactionCategoryType.EXPENSE],
    ["Entertainment", TransactionCategoryType.EXPENSE],
  ];
  const transactionCategories = Object.fromEntries(
    await Promise.all(
      categorySpecs.map(async ([name, type]) => {
        const category = await db.transactionCategory.upsert({
          where: { name },
          update: { type },
          create: { name, type },
        });
        return [name, category];
      }),
    ),
  );

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
      poolInEnvelopes: true,
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
    update: {},
    create: { ticker: "AAPL", exchange: "NASDAQ", name: "Apple Inc." },
  });
  const microsoftTicker = await db.stockTicker.upsert({
    where: { ticker_exchange: { ticker: "MSFT", exchange: "NASDAQ" } },
    update: {},
    create: {
      ticker: "MSFT",
      exchange: "NASDAQ",
      name: "Microsoft Corporation",
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

  const transactions = [];
  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo -= 1) {
    const timestamp = monthStart(monthsAgo);
    const monthVariation = (11 - monthsAgo) * 35;
    const rows = [
      [
        "Monthly salary",
        3400 + monthVariation,
        "Salary",
        TransactionType.INCOME,
        2,
      ],
      [
        "Freelance project",
        350 + (monthsAgo % 3) * 125,
        "Freelance",
        TransactionType.INCOME,
        8,
      ],
      ["Rent", 1150, "Housing", TransactionType.EXPENSE, 3],
      [
        "Groceries",
        420 + (monthsAgo % 4) * 18,
        "Groceries",
        TransactionType.EXPENSE,
        12,
      ],
      ["Public transport", 68, "Transport", TransactionType.EXPENSE, 15],
      [
        "Dinner and cinema",
        95 + (monthsAgo % 2) * 25,
        "Entertainment",
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
        categoryId: transactionCategories[category].id,
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
  await db.transaction.create({
    data: {
      description: `${DEMO} Summer holiday deposit`,
      amount: 600,
      currency: "EUR",
      type: TransactionType.EXPENSE,
      status: TransactionStatus.PLANNED,
      categoryId: transactionCategories.Entertainment.id,
      createdById: user.id,
      timestamp: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await db.transactionTemplate.createMany({
    data: [
      {
        description: `${DEMO} Groceries`,
        amount: 80,
        currency: "EUR",
        type: TransactionType.EXPENSE,
        categoryId: transactionCategories.Groceries.id,
        createdById: user.id,
      },
      {
        description: `${DEMO} Freelance invoice`,
        amount: 500,
        currency: "EUR",
        type: TransactionType.INCOME,
        categoryId: transactionCategories.Freelance.id,
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
  console.log("  73 transactions, 12 months of history, 5 holdings");
  console.log("  2 stock tickers with monthly prices and EUR exchange rates");
  console.log("  3 envelopes and 2 transaction templates");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
