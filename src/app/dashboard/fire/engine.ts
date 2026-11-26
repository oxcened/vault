export type Condition =
  | { type: "age"; value: number }
  | { type: "portfolio"; value: number }
  | { type: "targetPercent"; value: number }
  | { type: "coast" };
export type Phase = {
  name: string;
  start: Condition;
  end?: Condition;
  contribution: number;
  expenses: number;
  income: number;
};
export type Event = {
  age: number;
  lumpSum: number;
  incomeChange: number;
  spendingChange: number;
};
export type Plan = {
  age: number;
  lifeExpectancy: number;
  retirementAge: number;
  portfolio: number;
  annualReturn: number;
  inflation: number;
  withdrawalRate: number;
  retirementSpending: number;
  phases: Phase[];
  events: Event[];
  flamingoFraction: number;
};
export type Point = {
  month: number;
  age: number;
  portfolio: number;
  invested: number;
  growth: number;
  target: number;
  phase: string;
  shortfall: number;
};
export type Result = {
  points: Point[];
  fullFireAge: number | null;
  coastAge: number | null;
  flamingoAge: number | null;
  retirementPortfolio: number | null;
  depletedAge: number | null;
};
export const realReturn = (nominal: number, inflation: number) =>
  (1 + nominal) / (1 + inflation) - 1;
export const effectiveMonthlyRate = (annual: number) =>
  Math.pow(1 + annual, 1 / 12) - 1;

type ConditionContext = {
  age: number;
  portfolio: number;
  target: number;
  monthlyRate: number;
  retirementAge: number;
};

function matchesCondition(
  condition: Condition,
  context: ConditionContext,
): boolean {
  const { age, portfolio, target, monthlyRate, retirementAge } = context;
  switch (condition.type) {
    case "age":
      return age + 1e-8 >= condition.value;
    case "portfolio":
      return portfolio >= condition.value;
    case "targetPercent":
      return portfolio >= (target * condition.value) / 100;
    case "coast": {
      const remainingMonths = Math.max(
        0,
        Math.round((retirementAge - age) * 12),
      );
      return (
        age <= retirementAge &&
        portfolio * Math.pow(1 + monthlyRate, remainingMonths) >= target
      );
    }
  }
}

/** Simulates monthly cash flows in today's purchasing power. */
export function simulate(plan: Plan): Result {
  const rate = effectiveMonthlyRate(
    realReturn(plan.annualReturn, plan.inflation),
  );
  const target = (plan.retirementSpending * 12) / plan.withdrawalRate;
  const duration = Math.round((plan.lifeExpectancy - plan.age) * 12);
  let portfolio = plan.portfolio;
  let invested = portfolio;
  let phaseIndex = -1;
  let incomeChange = 0;
  let spendingChange = 0;
  let fullFireAge: number | null = null;
  let coastAge: number | null = null;
  let flamingoAge: number | null = null;
  let retirementPortfolio: number | null = null;
  let depletedAge: number | null = null;
  const points: Point[] = [];
  for (let month = 0; month <= duration; month++) {
    const age = plan.age + month / 12;
    for (const event of plan.events) {
      if (Math.round((event.age - plan.age) * 12) === month) {
        portfolio = Math.max(0, portfolio + event.lumpSum);
        invested += Math.max(0, event.lumpSum);
        incomeChange += event.incomeChange;
        spendingChange += event.spendingChange;
      }
    }
    const context: ConditionContext = {
      age,
      portfolio,
      target,
      monthlyRate: rate,
      retirementAge: plan.retirementAge,
    };
    while (phaseIndex + 1 < plan.phases.length) {
      const current = plan.phases[phaseIndex];
      const next = plan.phases[phaseIndex + 1]!;
      if (
        (!current || !current.end || matchesCondition(current.end, context)) &&
        matchesCondition(next.start, context)
      )
        phaseIndex++;
      else break;
    }
    if (target > 0 && fullFireAge === null && portfolio >= target)
      fullFireAge = age;
    if (
      target > 0 &&
      flamingoAge === null &&
      portfolio >= target * plan.flamingoFraction
    )
      flamingoAge = age;
    if (
      target > 0 &&
      coastAge === null &&
      matchesCondition({ type: "coast" }, context)
    )
      coastAge = age;
    const retired = age + 1e-8 >= plan.retirementAge;
    if (retired && retirementPortfolio === null)
      retirementPortfolio = portfolio;
    const phase = plan.phases[phaseIndex];
    const point: Point = {
      month,
      age,
      portfolio,
      invested,
      growth: portfolio - invested,
      target,
      phase: retired ? "Retirement" : (phase?.name ?? "Waiting"),
      shortfall: 0,
    };
    points.push(point);
    if (month === duration) break;
    const net = retired
      ? incomeChange - plan.retirementSpending - spendingChange
      : (phase?.contribution ?? 0) +
        (phase?.income ?? 0) -
        (phase?.expenses ?? 0) +
        incomeChange -
        spendingChange;
    const available = portfolio * (1 + rate);
    const shortfall = Math.max(0, -available - net);
    if (shortfall > 0 && depletedAge === null) depletedAge = age + 1 / 12;
    point.shortfall = shortfall;
    portfolio = Math.max(0, available + net);
    invested += Math.max(0, net);
  }
  return {
    points,
    fullFireAge,
    coastAge,
    flamingoAge,
    retirementPortfolio,
    depletedAge,
  };
}

const SEARCH_ITERATIONS = 70;

function searchBoundary(
  predicate: (value: number) => boolean,
  upper: number,
  seekMinimum: boolean,
): number | null {
  const atZero = predicate(0);
  if (seekMinimum ? atZero : !atZero) return seekMinimum ? 0 : null;
  const atUpper = predicate(upper);
  if (seekMinimum ? !atUpper : atUpper) return seekMinimum ? null : upper;

  let low = 0;
  let high = upper;
  for (let i = 0; i < SEARCH_ITERATIONS; i++) {
    const midpoint = (low + high) / 2;
    if (predicate(midpoint) === seekMinimum) high = midpoint;
    else low = midpoint;
  }
  return seekMinimum ? high : low;
}

/** Binary-search a monotonic outcome; null means no solution in range. */
export function solveMinimum(
  predicate: (value: number) => boolean,
  upper: number,
): number | null {
  return searchBoundary(predicate, upper, true);
}

/** Binary-search a monotonic outcome; null means no solution in range. */
export function solveMaximum(
  predicate: (value: number) => boolean,
  upper: number,
): number | null {
  return searchBoundary(predicate, upper, false);
}
