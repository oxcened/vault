"use client";
import { ChevronDown, CircleHelp, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "~/components/ui/collapsible";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { AmountInput } from "~/components/ui/amount-input";
import { APP_CURRENCY } from "~/constants";
import { getCurrencyFractionDigits } from "~/utils/currency";
import { type Phase, type Condition, type Event } from "./engine";
import { type RouterOutputs } from "~/trpc/react";
import {
  type Mode,
  type Strategy,
  type Scenario,
  makeScenario,
  n,
} from "./scenario";
import { NumericAmountInput, NumericInput } from "./numeric-inputs";

type Props = {
  s: Scenario;
  data: RouterOutputs["dashboard"]["getSummary"] | undefined;
  update: (patch: Partial<Scenario>) => void;
};
export function ScenarioForm({ s, data, update }: Props) {
  const field = (label: string, property: keyof Scenario, monetary = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={String(property)}>{label}</Label>
      {monetary ? (
        <AmountInput
          id={String(property)}
          value={String(s?.[property] ?? "")}
          currency={APP_CURRENCY}
          maxFractionDigits={getCurrencyFractionDigits(APP_CURRENCY)}
          onValueChange={(value) => update({ [property]: value })}
        />
      ) : (
        <Input
          id={String(property)}
          type="number"
          step="any"
          value={String(s?.[property] ?? "")}
          onChange={(event) => update({ [property]: event.target.value })}
        />
      )}
    </div>
  );
  const setPhase = (index: number, patch: Partial<Phase>) =>
    update({
      phases: s!.phases.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    });
  const setEvent = (index: number, patch: Partial<Event>) =>
    update({
      events: s!.events.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    });
  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Scenario name</Label>
        <Input
          id="name"
          value={s.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label htmlFor="mode">Calculate</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Explain calculation modes"
                  className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <CircleHelp className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-xs space-y-2 leading-relaxed"
              >
                <p>
                  <strong>When can I retire?</strong> Find the earliest age that
                  reaches the FIRE target and funds spending through life
                  expectancy.
                </p>
                <p>
                  <strong>Can I retire at a specific age?</strong> Check whether
                  your chosen retirement age meets those conditions.
                </p>
                <p>
                  <strong>How much should I invest?</strong> Estimate the
                  monthly contribution needed to meet those conditions at your
                  chosen age.
                </p>
                <p>
                  <strong>How much can I spend?</strong> Estimate the monthly
                  retirement spending that meets those conditions at your chosen
                  age.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select
          value={s.mode}
          onValueChange={(value) => update({ mode: value as Mode })}
        >
          <SelectTrigger id="mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="when">When can I retire?</SelectItem>
            <SelectItem value="atAge">
              Can I retire at a specific age?
            </SelectItem>
            <SelectItem value="contribution">
              How much should I invest?
            </SelectItem>
            <SelectItem value="spending">How much can I spend?</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label htmlFor="strategy">Strategy</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Explain FIRE strategies"
                  className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <CircleHelp className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-xs space-y-2 leading-relaxed"
              >
                <p>
                  <strong>Full FIRE:</strong> Continue investing until
                  retirement, then fund spending from your portfolio.
                </p>
                <p>
                  <strong>Coast FIRE:</strong> Stop contributing when your
                  portfolio could grow to the FIRE target by retirement.
                </p>
                <p>
                  <strong>Flamingo FIRE:</strong> Stop contributing when your
                  portfolio reaches your chosen percentage of the FIRE target.
                </p>
                <p>
                  <strong>Barista FIRE:</strong> At your chosen percentage of
                  the FIRE target, switch to part-time income and expenses; any
                  shortfall comes from your portfolio.
                </p>
                <p>
                  <strong>Custom phases:</strong> Define your own sequence of
                  contributions, expenses, income, and start conditions.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select
          value={s.strategy}
          onValueChange={(value) => update({ strategy: value as Strategy })}
        >
          <SelectTrigger id="strategy">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full FIRE</SelectItem>
            <SelectItem value="coast">Coast FIRE</SelectItem>
            <SelectItem value="flamingo">Flamingo FIRE</SelectItem>
            <SelectItem value="barista">Barista FIRE</SelectItem>
            <SelectItem value="custom">Custom phases</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {field("Current age", "age")}
      {field("Invested capital", "portfolio", true)}
      {s.mode !== "contribution" &&
        s.strategy !== "custom" &&
        field("Monthly contribution", "contribution", true)}
      {s.mode !== "spending" &&
        field("Monthly retirement spending", "spending", true)}
      {s.mode !== "when" && field("Retirement age", "retire")}
      {(s.strategy === "flamingo" || s.strategy === "barista") &&
        field("Transition at % of FIRE target", "flamingo")}
      {s.strategy === "barista" && (
        <>
          {field("Part-time monthly income", "baristaIncome", true)}
          {field("Part-time monthly expenses", "baristaSpending", true)}
        </>
      )}
      <Collapsible className="border-t pt-3">
        <CollapsibleTrigger className="group flex w-full items-center justify-between text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          Advanced assumptions{" "}
          <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3">
          {field("Expected annual return (%)", "annualReturn")}
          {field("Annual inflation (%)", "inflation")}
          {field("Withdrawal rate (%)", "withdrawal")}
          {field("Life expectancy", "life")}
          {field("State pension eligibility age (optional)", "pensionAge")}
        </CollapsibleContent>
      </Collapsible>
      {s.strategy === "custom" && (
        <div className="space-y-3 border-t pt-3">
          <h2 className="font-medium">Phases</h2>
          <p className="text-xs text-muted-foreground">
            Phases run in order. Each starts when its condition is met.
          </p>
          {s.phases.map((phase, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <div className="flex justify-between">
                <span className="text-sm">Phase {i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove phase ${i + 1}`}
                  onClick={() =>
                    update({
                      phases: s.phases.filter((_, j) => i !== j),
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Label htmlFor={`phase-name-${i}`}>Name</Label>
              <Input
                id={`phase-name-${i}`}
                value={phase.name}
                onChange={(e) => setPhase(i, { name: e.target.value })}
              />
              <Label htmlFor={`phase-trigger-${i}`}>Start condition</Label>
              <Select
                value={phase.start.type}
                onValueChange={(value) =>
                  setPhase(i, {
                    start:
                      value === "coast"
                        ? { type: "coast" }
                        : {
                            type: value as
                              | "age"
                              | "portfolio"
                              | "targetPercent",
                            value: 0,
                          },
                  })
                }
              >
                <SelectTrigger id={`phase-trigger-${i}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="age">Age</SelectItem>
                  <SelectItem value="portfolio">Portfolio value</SelectItem>
                  <SelectItem value="targetPercent">
                    % of FIRE target
                  </SelectItem>
                  <SelectItem value="coast">Coast FIRE</SelectItem>
                </SelectContent>
              </Select>
              {phase.start.type !== "coast" &&
                (phase.start.type === "portfolio" ? (
                  <NumericAmountInput
                    id={`phase-start-value-${i}`}
                    label={`Phase ${i + 1} start value`}
                    value={phase.start.value}
                    onChange={(value) =>
                      setPhase(i, {
                        start: { ...phase.start, value } as Condition,
                      })
                    }
                  />
                ) : (
                  <NumericInput
                    id={`phase-start-value-${i}`}
                    label={`Phase ${i + 1} start value`}
                    value={phase.start.value}
                    onChange={(value) =>
                      setPhase(i, {
                        start: { ...phase.start, value } as Condition,
                      })
                    }
                  />
                ))}
              {(
                [
                  ["contribution", "Monthly contribution"],
                  ["expenses", "Monthly expenses"],
                  ["income", "Monthly income"],
                ] as const
              ).map(([prop, label]) => (
                <div key={prop}>
                  <Label htmlFor={`phase-${prop}-${i}`}>{label}</Label>
                  <NumericAmountInput
                    id={`phase-${prop}-${i}`}
                    value={phase[prop]}
                    onChange={(value) => setPhase(i, { [prop]: value })}
                  />
                </div>
              ))}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              update({
                phases: [
                  ...s.phases,
                  {
                    name: `Phase ${s.phases.length + 1}`,
                    start: { type: "age", value: n(s.age) },
                    contribution: 0,
                    expenses: 0,
                    income: 0,
                  },
                ],
              })
            }
          >
            <Plus /> Add phase
          </Button>
        </div>
      )}
      <Collapsible className="border-t pt-3">
        <CollapsibleTrigger className="group flex w-full items-center justify-between text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          Future events{" "}
          <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="mt-2 text-xs text-muted-foreground">
            Changes to income and spending continue from the event age. Use
            negative changes to end them.
          </p>
          {s.events.map((event, i) => (
            <div key={i} className="mt-3 space-y-2 rounded-lg border p-3">
              <div className="flex justify-between">
                <span>Event {i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove event ${i + 1}`}
                  onClick={() =>
                    update({
                      events: s.events.filter((_, j) => i !== j),
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              {(
                [
                  ["age", "Age"],
                  ["lumpSum", "Lump sum"],
                  ["incomeChange", "Monthly income change"],
                  ["spendingChange", "Monthly spending change"],
                ] as const
              ).map(([prop, label]) => (
                <div key={prop}>
                  <Label htmlFor={`event-${prop}-${i}`}>{label}</Label>
                  {prop === "age" ? (
                    <NumericInput
                      id={`event-${prop}-${i}`}
                      value={event.age}
                      onChange={(value) => setEvent(i, { age: value })}
                    />
                  ) : (
                    <NumericAmountInput
                      id={`event-${prop}-${i}`}
                      value={event[prop]}
                      onChange={(value) => setEvent(i, { [prop]: value })}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={() =>
              update({
                events: [
                  ...s.events,
                  {
                    age: n(s.age),
                    lumpSum: 0,
                    incomeChange: 0,
                    spendingChange: 0,
                  },
                ],
              })
            }
          >
            <Plus /> Add event
          </Button>
        </CollapsibleContent>
      </Collapsible>
      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const defaults = makeScenario(
              data?.firePortfolio?.toNumber() ?? 0,
              Math.max(
                0,
                data?.cashFlowAvgLast6Months.netFlow?.toNumber() ?? 0,
              ),
              Math.max(
                0,
                data?.cashFlowAvgLast6Months.expenses?.toNumber() ?? 0,
              ),
            );
            update({ ...defaults, id: s.id, name: s.name });
          }}
        >
          Reset from my data
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            update({
              age: "",
              life: "",
              retire: "",
              pensionAge: "",
              portfolio: "",
              contribution: "",
              spending: "",
              annualReturn: "",
              inflation: "",
              withdrawal: "",
              flamingo: "",
              baristaIncome: "",
              baristaSpending: "",
              phases: [],
              events: [],
            })
          }
        >
          Clear everything
        </Button>
      </div>
    </section>
  );
}
