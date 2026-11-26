import { z } from "zod";
import { type Scenario } from "./scenario";

const conditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("age"), value: z.number().finite() }),
  z.object({ type: z.literal("portfolio"), value: z.number().finite() }),
  z.object({ type: z.literal("targetPercent"), value: z.number().finite() }),
  z.object({ type: z.literal("coast") }),
]);

const scenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  mode: z.enum(["when", "atAge", "contribution", "spending"]),
  strategy: z.enum(["full", "coast", "flamingo", "barista", "custom"]),
  age: z.string(),
  life: z.string(),
  retire: z.string(),
  pensionAge: z.string(),
  portfolio: z.string(),
  contribution: z.string(),
  spending: z.string(),
  annualReturn: z.string(),
  inflation: z.string(),
  withdrawal: z.string(),
  flamingo: z.string(),
  baristaIncome: z.string(),
  baristaSpending: z.string(),
  nominal: z.boolean(),
  phases: z.array(
    z.object({
      name: z.string(),
      start: conditionSchema,
      end: conditionSchema.optional(),
      contribution: z.number().finite(),
      expenses: z.number().finite(),
      income: z.number().finite(),
    }),
  ),
  events: z.array(
    z.object({
      age: z.number().finite(),
      lumpSum: z.number().finite(),
      incomeChange: z.number().finite(),
      spendingChange: z.number().finite(),
    }),
  ),
});

const scenarioStorageKey = (userId: string) =>
  `vault:fire:scenarios:v1:${userId}`;

export function loadScenarios(
  storage: Storage,
  userId: string,
  fallback: Scenario,
): Scenario[] {
  const raw = storage.getItem(scenarioStorageKey(userId));
  if (!raw) return [fallback];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [fallback];
  const scenarios = parsed.flatMap((item: unknown) => {
    const result = scenarioSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
  return scenarios.length ? scenarios : [fallback];
}

export function saveScenarios(
  storage: Storage,
  userId: string,
  scenarios: Scenario[],
) {
  storage.setItem(scenarioStorageKey(userId), JSON.stringify(scenarios));
}
