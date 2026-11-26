"use client";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Checkbox } from "~/components/ui/checkbox";
import { RoundedCurrency } from "~/components/ui/number";
import { usePrivacy } from "~/components/privacy";
import { type Scenario, calculate, currency, n, ageText } from "./scenario";

type Props = {
  s: Scenario;
  scenarios: Scenario[];
  compare: string[];
  setCompare: (values: string[]) => void;
  update: (patch: Partial<Scenario>) => void;
};
export function SimulationResults({
  s,
  scenarios,
  compare,
  setCompare,
  update,
}: Props) {
  const { mode: privacy } = usePrivacy();
  const calc = useMemo(() => calculate(s), [s]);
  const comparisons = useMemo(
    () =>
      scenarios
        .filter((item) => compare.includes(item.id) && item.id !== s.id)
        .map((item) => ({ scenario: item, calculation: calculate(item) }))
        .filter((item) => item.calculation !== null),
    [scenarios, compare, s.id],
  );
  const dataPoints =
    calc?.result.points.map((p) => {
      const scale = s.nominal
        ? Math.pow(1 + n(s.inflation) / 100, p.month / 12)
        : 1;
      const row: Record<string, number> = {
        age: p.age,
        portfolio: p.portfolio * scale,
        invested: p.invested * scale,
        growth: p.growth * scale,
        target: p.target * scale,
      };
      comparisons.forEach(({ scenario, calculation }) => {
        const match = calculation!.result.points.find(
          (point) => Math.abs(point.age - p.age) < 1 / 24,
        );
        if (match)
          row[scenario.id] =
            match.portfolio *
            (s.nominal
              ? Math.pow(1 + n(scenario.inflation) / 100, match.month / 12)
              : 1);
      });
      return row;
    }) ?? [];
  const phaseRegions: { start: number; end: number; label: string }[] = [];
  if (calc) {
    for (const point of calc.result.points) {
      const last = phaseRegions.at(-1);
      if (!last || last.label !== point.phase)
        phaseRegions.push({
          start: point.age,
          end: point.age,
          label: point.phase,
        });
      else last.end = point.age;
    }
    for (let i = 0; i < phaseRegions.length - 1; i++)
      phaseRegions[i]!.end = phaseRegions[i + 1]!.start;
  }
  const pensionAge =
    s.pensionAge?.trim() && Number.isFinite(n(s.pensionAge))
      ? n(s.pensionAge)
      : null;
  const retirementFactor =
    s.nominal && calc?.retirement !== null && calc?.retirement !== undefined
      ? Math.pow(1 + n(s.inflation) / 100, calc.retirement - calc.plan.age)
      : 1;
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Results</h2>
        <div className="flex items-center gap-2 text-sm">
          <Checkbox
            id="nominal-values"
            checked={s.nominal}
            onCheckedChange={(checked) => update({ nominal: checked === true })}
          />
          <label htmlFor="nominal-values">Show nominal values</label>
        </div>
      </div>
      {!calc ? (
        <p className="text-sm text-destructive">
          Enter valid assumptions and at least one valid phase for a custom
          plan. Retirement age must be before life expectancy.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(
              [
                [
                  "Full FIRE target",
                  <RoundedCurrency
                    key="target"
                    value={
                      (calc.plan.retirementSpending * 12 * retirementFactor) /
                      calc.plan.withdrawalRate
                    }
                  />,
                ],
                ["Retirement age", ageText(calc.retirement)],
                [
                  "Years until retirement",
                  calc.retirement === null
                    ? "Not reached"
                    : (calc.retirement - calc.plan.age).toFixed(1),
                ],
                ["Coast FIRE age", ageText(calc.result.coastAge)],
                ["Flamingo FIRE age", ageText(calc.result.flamingoAge)],
                ...(s.mode === "contribution"
                  ? [
                      [
                        "Required monthly investment",
                        calc.required === null ? (
                          "Unreachable"
                        ) : (
                          <RoundedCurrency
                            key="required"
                            value={calc.required}
                          />
                        ),
                      ],
                    ]
                  : []),
                ...(s.mode === "spending"
                  ? [
                      [
                        "Sustainable monthly spending",
                        calc.sustainableSpending === null ? (
                          "Unreachable"
                        ) : (
                          <RoundedCurrency
                            key="spending"
                            value={calc.sustainableSpending * retirementFactor}
                          />
                        ),
                      ],
                    ]
                  : []),
                [
                  "Portfolio at retirement",
                  calc.result.retirementPortfolio === null ? (
                    "—"
                  ) : (
                    <RoundedCurrency
                      key="portfolio"
                      value={calc.result.retirementPortfolio * retirementFactor}
                    />
                  ),
                ],
              ] as [string, React.ReactNode][]
            ).map(([label, value]) => (
              <div key={label} className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-sm">
            {calc.achievable
              ? "The target is achievable under these assumptions."
              : "The target is not achievable within this plan."}{" "}
            {calc.result.depletedAge !== null &&
              `The portfolio first falls short at age ${ageText(calc.result.depletedAge)}.`}
          </p>
          <div className="space-y-3 rounded-lg border p-4">
            <h2 className="font-semibold">Portfolio projection</h2>
            {scenarios.length > 1 && (
              <div className="flex flex-wrap gap-3 text-xs">
                {scenarios
                  .filter((item) => item.id !== s.id)
                  .map((item) => (
                    <div key={item.id} className="flex items-center gap-1">
                      <Checkbox
                        id={`compare-${item.id}`}
                        checked={compare.includes(item.id)}
                        onCheckedChange={(checked) =>
                          setCompare(
                            checked === true
                              ? [...compare, item.id]
                              : compare.filter((id) => id !== item.id),
                          )
                        }
                      />
                      <label htmlFor={`compare-${item.id}`}>{item.name}</label>
                    </div>
                  ))}
              </div>
            )}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataPoints} style={{ fontSize: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="age"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                  />
                  {phaseRegions.map((region, index) => (
                    <ReferenceArea
                      key={`${region.label}-${index}`}
                      x1={region.start}
                      x2={region.end}
                      fill={
                        region.label === "Retirement"
                          ? "#a78bfa"
                          : region.label === "Coasting"
                            ? "#fbbf24"
                            : "#34d399"
                      }
                      fillOpacity={0.08}
                      strokeOpacity={0}
                    />
                  ))}
                  {(
                    [
                      ["Coast", calc.result.coastAge],
                      ["Flamingo", calc.result.flamingoAge],
                      ["FIRE", calc.result.fullFireAge],
                      ["Pension", pensionAge],
                    ] as [string, number | null][]
                  )
                    .filter(
                      ([, age]) =>
                        age !== null &&
                        age >= calc.plan.age &&
                        age <= calc.plan.lifeExpectancy,
                    )
                    .map(([label, age]) => (
                      <ReferenceLine
                        key={label}
                        x={age!}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="3 3"
                        label={{
                          value: label,
                          position: "insideTop",
                          fontSize: 10,
                          fill: "hsl(var(--foreground))",
                        }}
                      />
                    ))}
                  <YAxis
                    width={70}
                    tickFormatter={(v) =>
                      privacy === "off" ? currency(v) : "•••"
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                      borderColor: "hsl(var(--border))",
                    }}
                    labelFormatter={(value) =>
                      `Age ${Number(value).toFixed(1)}`
                    }
                    formatter={(value: number) =>
                      privacy === "off" ? currency(value) : "••••"
                    }
                  />
                  <Line
                    dataKey="portfolio"
                    name={s.name}
                    stroke="var(--chart-1)"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    dataKey="invested"
                    name="Total contributions"
                    stroke="var(--chart-2)"
                    dot={false}
                  />
                  <Line
                    dataKey="growth"
                    name="Investment growth"
                    stroke="#8b5cf6"
                    dot={false}
                  />
                  <Line
                    dataKey="target"
                    name="FIRE target"
                    stroke="var(--chart-3)"
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  {comparisons.map(({ scenario }, i) => (
                    <Line
                      key={scenario.id}
                      dataKey={scenario.id}
                      name={scenario.name}
                      stroke={["#3b82f6", "#f59e0b", "#ec4899"][i % 3]}
                      dot={false}
                    />
                  ))}
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h2 className="font-semibold">Financial freedom timeline</h2>
            <div className="mt-3 space-y-3 text-sm">
              {(
                [
                  ["Now", calc.plan.age, "Your starting point."],
                  [
                    "Coast FIRE",
                    calc.result.coastAge,
                    "Your portfolio could grow to the target by retirement without further contributions.",
                  ],
                  [
                    "Flamingo FIRE",
                    calc.result.flamingoAge,
                    `Your portfolio reaches ${s.flamingo}% of the FIRE target.`,
                  ],
                  [
                    "Full FIRE",
                    calc.result.fullFireAge,
                    "Your portfolio first reaches the spending target.",
                  ],
                  [
                    "Retirement",
                    calc.retirement,
                    "The plan starts funding retirement spending.",
                  ],
                  ...(pensionAge !== null
                    ? [
                        [
                          "State pension eligibility",
                          pensionAge,
                          "Your chosen eligibility age. Add a future income event to model pension payments.",
                        ] as [string, number | null, string],
                      ]
                    : []),
                  [
                    "End of simulation",
                    calc.plan.lifeExpectancy,
                    "The projection ends at your life expectancy.",
                  ],
                ] as [string, number | null, string][]
              )
                .sort(([, first], [, second]) =>
                  first === null
                    ? second === null
                      ? 0
                      : 1
                    : second === null
                      ? -1
                      : first - second,
                )
                .map(([label, age, description]) => (
                  <div key={label} className="flex gap-4 border-b pb-3">
                    <span className="w-28 shrink-0 font-medium">
                      {ageText(age)}
                    </span>
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-muted-foreground">{description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Phase shading: green for accumulation, amber for coasting, and
            purple for retirement. Projections use deterministic monthly returns
            and values in today’s purchasing power unless nominal values are
            selected. They do not guarantee future performance; taxes and fees
            are not modelled separately.
          </p>
        </>
      )}
    </section>
  );
}
