import { APP_CURRENCY } from "~/constants";
import {
  simulate,
  solveMinimum,
  solveMaximum,
  type Plan,
  type Phase,
  type Condition,
  type Event,
} from "./engine";

export type Mode = "when" | "atAge" | "contribution" | "spending";
export type Strategy = "full" | "coast" | "flamingo" | "barista" | "custom";
export type Scenario = {
  id: string;
  name: string;
  mode: Mode;
  strategy: Strategy;
  age: string;
  life: string;
  retire: string;
  pensionAge: string;
  portfolio: string;
  contribution: string;
  spending: string;
  annualReturn: string;
  inflation: string;
  withdrawal: string;
  flamingo: string;
  baristaIncome: string;
  baristaSpending: string;
  phases: Phase[];
  events: Event[];
  nominal: boolean;
};
export const newId = () => Math.random().toString(36).slice(2);
export const makeScenario = (
  portfolio: number,
  contribution: number,
  spending: number,
): Scenario => ({
  id: newId(),
  name: "My plan",
  mode: "when",
  strategy: "full",
  age: "30",
  life: "95",
  retire: "60",
  pensionAge: "",
  portfolio: String(portfolio),
  contribution: String(contribution),
  spending: String(spending),
  annualReturn: "7",
  inflation: "2",
  withdrawal: "4",
  flamingo: "50",
  baristaIncome: "1000",
  baristaSpending: "2000",
  phases: [],
  events: [],
  nominal: false,
});
export const n = (s: string) => Number(s);
export const currency = (v: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: APP_CURRENCY,
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(v);
export const ageText = (age: number | null) => {
  if (age === null) return "Not reached";
  const months = Math.round(age * 12);
  return `${Math.floor(months / 12)} yr ${months % 12} mo`;
};

function buildPlan(
  s: Scenario,
  retirementAge: number,
  contribution: number,
  spending: number,
): Plan {
  const age = n(s.age);
  const start: Condition = { type: "age", value: age };
  let phases: Phase[] = [
    { name: "Accumulation", start, contribution, expenses: 0, income: 0 },
  ];
  if (s.strategy === "coast" || s.strategy === "flamingo") {
    const trigger: Condition =
      s.strategy === "coast"
        ? { type: "coast" }
        : { type: "targetPercent", value: n(s.flamingo) };
    phases = [
      { ...phases[0]!, end: trigger },
      {
        name: "Coasting",
        start: trigger,
        contribution: 0,
        expenses: 0,
        income: 0,
      },
    ];
  } else if (s.strategy === "barista") {
    const trigger: Condition = { type: "targetPercent", value: n(s.flamingo) };
    phases = [
      { ...phases[0]!, end: trigger },
      {
        name: "Part-time work",
        start: trigger,
        contribution: 0,
        expenses: n(s.baristaSpending),
        income: n(s.baristaIncome),
      },
    ];
  } else if (s.strategy === "custom") {
    phases = s.phases.map((phase, i) => ({
      ...phase,
      contribution:
        s.mode === "contribution" ? contribution : phase.contribution,
      end: s.phases[i + 1]?.start,
    }));
  }
  return {
    age,
    lifeExpectancy: n(s.life),
    retirementAge,
    portfolio: n(s.portfolio),
    annualReturn: n(s.annualReturn) / 100,
    inflation: n(s.inflation) / 100,
    withdrawalRate: n(s.withdrawal) / 100,
    retirementSpending: spending,
    phases,
    events: s.events,
    flamingoFraction:
      (n(s.flamingo) > 0 && n(s.flamingo) <= 100 ? n(s.flamingo) : 50) / 100,
  };
}
export function calculate(s: Scenario) {
  const age = n(s.age),
    life = n(s.life),
    retirement = n(s.retire),
    contribution = n(s.contribution),
    spending = n(s.spending);
  const usable =
    [
      s.age,
      s.life,
      ...(s.mode === "when" ? [] : [s.retire]),
      s.portfolio,
      s.annualReturn,
      s.inflation,
      s.withdrawal,
      ...(["flamingo", "barista"].includes(s.strategy) ? [s.flamingo] : []),
      ...(s.mode === "contribution" || s.strategy === "custom"
        ? []
        : [s.contribution]),
      ...(s.mode === "spending" ? [] : [s.spending]),
    ].every((x) => x.trim() !== "" && Number.isFinite(n(x))) &&
    age >= 0 &&
    life > age &&
    life <= 120 &&
    (s.mode === "when" || (retirement >= age && retirement < life)) &&
    n(s.portfolio) >= 0 &&
    n(s.annualReturn) > -100 &&
    n(s.inflation) > -100 &&
    n(s.withdrawal) > 0 &&
    n(s.withdrawal) <= 100 &&
    (!["flamingo", "barista"].includes(s.strategy) ||
      (n(s.flamingo) > 0 && n(s.flamingo) <= 100)) &&
    (s.mode === "contribution" ||
      s.strategy === "custom" ||
      contribution >= 0) &&
    (s.mode === "spending" || spending > 0) &&
    (s.strategy !== "custom" ||
      (s.phases.length > 0 &&
        s.phases.every(
          (p) =>
            p.name.trim() &&
            (p.start.type === "coast" || Number.isFinite(p.start.value)) &&
            p.contribution >= 0 &&
            p.expenses >= 0 &&
            p.income >= 0,
        ))) &&
    s.events.every(
      (e) =>
        Number.isFinite(e.age) &&
        e.age >= age &&
        e.age <= life &&
        [e.lumpSum, e.incomeChange, e.spendingChange].every(Number.isFinite),
    );
  if (!usable) return null;
  const sustainable = (p: Plan) => {
    const r = simulate(p);
    return (
      r.retirementPortfolio !== null &&
      r.retirementPortfolio >= (p.retirementSpending * 12) / p.withdrawalRate &&
      r.depletedAge === null
    );
  };
  let chosen = retirement,
    required: number | null = null,
    sustainableSpending: number | null = null;
  if (s.mode === "when") {
    chosen = life;
    for (let month = 0; month < Math.round((life - age) * 12); month++) {
      const candidate = age + month / 12;
      if (sustainable(buildPlan(s, candidate, contribution, spending))) {
        chosen = candidate;
        break;
      }
    }
  }
  if (s.mode === "contribution")
    required = solveMinimum(
      (value) => sustainable(buildPlan(s, retirement, value, spending)),
      10000000,
    );
  if (s.mode === "spending")
    sustainableSpending = solveMaximum(
      (value) => sustainable(buildPlan(s, retirement, contribution, value)),
      10000000,
    );
  const plan = buildPlan(
    s,
    chosen,
    required ?? contribution,
    sustainableSpending ?? spending,
  );
  const result = simulate(plan);
  return {
    plan,
    result,
    required,
    sustainableSpending,
    retirement: s.mode === "when" && chosen === life ? null : chosen,
    achievable:
      s.mode === "when"
        ? chosen !== life
        : s.mode === "contribution"
          ? required !== null
          : s.mode === "spending"
            ? sustainableSpending !== null
            : sustainable(plan),
  };
}
