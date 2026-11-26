import { describe, expect, test } from "vitest";
import { calculate, makeScenario, type Scenario } from "./scenario";

const base = (): Scenario => ({
  ...makeScenario(0, 1000, 40),
  age: "30",
  life: "32",
  retire: "31",
  annualReturn: "0",
  inflation: "0",
  withdrawal: "4",
});

describe("FIRE scenario calculations", () => {
  test("finds an earliest retirement without requiring a hidden retirement age", () => {
    const result = calculate({ ...base(), mode: "when", retire: "" });
    expect(result?.retirement).toBe(31);
    expect(result?.achievable).toBe(true);
  });
  test("assesses retirement at a specific age", () => {
    expect(calculate({ ...base(), mode: "atAge" })?.achievable).toBe(true);
    expect(
      calculate({ ...base(), mode: "atAge", contribution: "100" })?.achievable,
    ).toBe(false);
  });
  test("calculates required contributions without an input contribution", () => {
    const result = calculate({
      ...base(),
      mode: "contribution",
      contribution: "",
    });
    expect(result?.required).toBeCloseTo(1000, 4);
  });
  test("calculates spending without an input spending amount", () => {
    const result = calculate({ ...base(), mode: "spending", spending: "" });
    expect(result?.sustainableSpending).toBeCloseTo(40, 4);
  });
  test("detects an unreachable contribution target", () => {
    expect(
      calculate({
        ...base(),
        mode: "contribution",
        retire: "30",
        contribution: "",
      })?.required,
    ).toBeNull();
  });
  test.each(["full", "coast", "flamingo", "barista"] as const)(
    "simulates %s strategy",
    (strategy) => {
      const result = calculate({
        ...base(),
        mode: "atAge",
        strategy,
        baristaIncome: "100",
        baristaSpending: "200",
      });
      expect(result).not.toBeNull();
      expect(result?.result.points).toHaveLength(25);
    },
  );
  test("custom phases do not require the hidden monthly contribution", () => {
    const result = calculate({
      ...base(),
      mode: "atAge",
      strategy: "custom",
      contribution: "",
      phases: [
        {
          name: "Work",
          start: { type: "age", value: 30 },
          contribution: 1000,
          expenses: 0,
          income: 0,
        },
      ],
    });
    expect(result?.result.retirementPortfolio).toBe(12000);
  });
  test("validates visible assumptions", () => {
    expect(calculate({ ...base(), mode: "atAge", withdrawal: "0" })).toBeNull();
    expect(calculate({ ...base(), mode: "atAge", retire: "" })).toBeNull();
  });
});
