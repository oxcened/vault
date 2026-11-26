import { test } from "vitest";
import { strict as assert } from "node:assert";
import {
  effectiveMonthlyRate,
  realReturn,
  simulate,
  solveMaximum,
  solveMinimum,
  type Plan,
} from "./engine";

const base: Plan = {
  age: 30,
  lifeExpectancy: 32,
  retirementAge: 31,
  portfolio: 12000,
  annualReturn: 0,
  inflation: 0,
  withdrawalRate: 0.04,
  retirementSpending: 1000,
  flamingoFraction: 0.5,
  phases: [
    {
      name: "Work",
      start: { type: "age", value: 30 },
      contribution: 1000,
      expenses: 0,
      income: 0,
    },
  ],
  events: [],
};
test("effective monthly rates and real returns compound correctly", () => {
  assert.ok(
    Math.abs(
      Math.pow(1 + effectiveMonthlyRate(realReturn(0.08, 0.03)), 12) -
        1 -
        (1.08 / 1.03 - 1),
    ) < 1e-12,
  );
});
test("simulates deposits, retirement withdrawals and depletion", () => {
  const result = simulate({ ...base, retirementSpending: 3000 });
  assert.equal(result.retirementPortfolio, 24000);
  assert.equal(result.depletedAge, 31 + 9 / 12);
  assert.equal(result.points.at(-1)?.portfolio, 0);
});
test("transitions at target threshold and applies events", () => {
  const result = simulate({
    ...base,
    portfolio: 0,
    retirementSpending: 20,
    phases: [
      {
        name: "Save",
        start: { type: "age", value: 30 },
        end: { type: "portfolio", value: 3000 },
        contribution: 1000,
        expenses: 0,
        income: 0,
      },
      {
        name: "Coast",
        start: { type: "portfolio", value: 3000 },
        contribution: 0,
        expenses: 0,
        income: 0,
      },
    ],
    events: [{ age: 30.5, lumpSum: 1000, incomeChange: 0, spendingChange: 0 }],
  });
  assert.equal(result.points[3]?.phase, "Coast");
  assert.equal(result.retirementPortfolio, 4000);
  assert.equal(result.flamingoAge, 30.25);
});
test("reverse searches and unreachable results", () => {
  assert.ok(Math.abs(solveMinimum((x) => x * 12 >= 6000, 1000)! - 500) < 1e-6);
  assert.ok(Math.abs(solveMaximum((x) => x * 12 <= 6000, 1000)! - 500) < 1e-6);
  assert.equal(
    solveMinimum((x) => x > 100, 50),
    null,
  );
});

test("finds the contribution needed to reach the retirement target", () => {
  const needed = solveMinimum((amount) => {
    const plan = {
      ...base,
      portfolio: 0,
      retirementSpending: 40,
      phases: [{ ...base.phases[0]!, contribution: amount }],
    };
    return (
      (simulate(plan).retirementPortfolio ?? 0) >=
      (plan.retirementSpending * 12) / plan.withdrawalRate
    );
  }, 2000);
  assert.ok(Math.abs(needed! - 1000) < 0.01);
});

test("detects coast when current capital can compound to the target", () => {
  const plan = {
    ...base,
    portfolio: 6000,
    annualReturn: 1,
    retirementSpending: 40,
  };
  const result = simulate(plan);
  assert.equal(result.coastAge, 30);
  assert.equal(result.flamingoAge, 30);
  assert.equal(result.fullFireAge, 30 + 5 / 12);
});

test("changes phase when an age condition is reached", () => {
  const result = simulate({
    ...base,
    portfolio: 0,
    phases: [
      {
        name: "Saving",
        start: { type: "age", value: 30 },
        end: { type: "age", value: 30.5 },
        contribution: 100,
        expenses: 0,
        income: 0,
      },
      {
        name: "Coasting",
        start: { type: "age", value: 30.5 },
        contribution: 0,
        expenses: 0,
        income: 0,
      },
    ],
  });
  assert.equal(result.points[5]?.phase, "Saving");
  assert.equal(result.points[6]?.phase, "Coasting");
  assert.equal(result.retirementPortfolio, 600);
});

test("changes phase at a percentage of the FIRE target", () => {
  const trigger = { type: "targetPercent", value: 50 } as const;
  const result = simulate({
    ...base,
    portfolio: 0,
    retirementSpending: 40,
    phases: [
      {
        name: "Saving",
        start: { type: "age", value: 30 },
        end: trigger,
        contribution: 1000,
        expenses: 0,
        income: 0,
      },
      {
        name: "Coasting",
        start: trigger,
        contribution: 0,
        expenses: 0,
        income: 0,
      },
    ],
  });
  assert.equal(result.points[6]?.phase, "Coasting");
  assert.equal(result.retirementPortfolio, 6000);
});

test("applies simultaneous income, spending and lump-sum events from their event month", () => {
  const result = simulate({
    ...base,
    portfolio: 1000,
    retirementSpending: 100,
    phases: [],
    events: [
      { age: 31, lumpSum: 200, incomeChange: 50, spendingChange: 0 },
      { age: 31, lumpSum: 0, incomeChange: 0, spendingChange: 25 },
    ],
  });
  assert.equal(result.retirementPortfolio, 1200);
  assert.equal(result.points[13]?.portfolio, 1125);
  assert.equal(result.points[24]?.portfolio, 300);
});

test("reports a shortfall rather than a negative balance after depletion", () => {
  const result = simulate({
    ...base,
    portfolio: 0,
    retirementAge: 30,
    retirementSpending: 100,
    phases: [],
  });
  assert.equal(result.depletedAge, 30 + 1 / 12);
  assert.equal(result.points[0]?.shortfall, 100);
  assert.equal(result.points.at(-1)?.portfolio, 0);
});

test("starts coasting when the coast trigger is met", () => {
  const trigger = { type: "coast" } as const;
  const result = simulate({
    ...base,
    portfolio: 6000,
    annualReturn: 1,
    retirementSpending: 40,
    phases: [
      {
        name: "Saving",
        start: { type: "age", value: 30 },
        end: trigger,
        contribution: 1000,
        expenses: 0,
        income: 0,
      },
      {
        name: "Coasting",
        start: trigger,
        contribution: 0,
        expenses: 0,
        income: 0,
      },
    ],
  });
  assert.equal(result.points[0]?.phase, "Coasting");
  assert.ok(Math.abs(result.retirementPortfolio! - 12000) < 0.001);
});
