"use client";

import { useSession } from "next-auth/react";
import { Copy, Flame, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import {
  Tooltip as UiTooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "~/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { makeScenario, newId, n } from "./scenario";
import { ScenarioForm } from "./scenario-form";
import { SimulationResults } from "./simulation-results";
import { useScenarios } from "./use-scenarios";

export default function FirePage() {
  const { data, isPending, isError } = api.dashboard.getSummary.useQuery(
    undefined,
    { refetchOnMount: "always" },
  );
  const { data: session } = useSession();
  const {
    isLoaded,
    scenarios,
    setScenarios,
    selected,
    setSelected,
    compare,
    setCompare,
    scenario: s,
    update,
  } = useScenarios(session?.user?.id, data);
  return (
    <>
      <header className="flex h-16 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DashboardBreadcrumb items={[{ label: "FIRE simulator" }]} />
      </header>
      <main className="mx-auto max-w-screen-xl space-y-6 p-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Flame className="size-6 text-orange-500" /> FIRE simulator
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore your path to financial independence.
          </p>
        </div>
        {isError ? (
          <p className="text-destructive">
            Could not load your financial data.
          </p>
        ) : isPending || !isLoaded || !s ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-48 flex-1 space-y-1">
                <Label htmlFor="scenario">Scenario</Label>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger id="scenario">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const item = {
                    ...makeScenario(
                      n(s.portfolio),
                      n(s.contribution),
                      n(s.spending),
                    ),
                    name: `Scenario ${scenarios.length + 1}`,
                  };
                  setScenarios([...scenarios, item]);
                  setSelected(item.id);
                }}
              >
                New
              </Button>
              <TooltipProvider>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Duplicate scenario"
                      onClick={() => {
                        const item = {
                          ...structuredClone(s),
                          id: newId(),
                          name: `${s.name} copy`,
                        };
                        setScenarios([...scenarios, item]);
                        setSelected(item.id);
                      }}
                    >
                      <Copy />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate scenario</TooltipContent>
                </UiTooltip>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete scenario"
                        disabled={scenarios.length === 1}
                        onClick={() => {
                          const rest = scenarios.filter(
                            (item) => item.id !== s.id,
                          );
                          setScenarios(rest);
                          setSelected(rest[0]!.id);
                          setCompare(compare.filter((id) => id !== s.id));
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Delete scenario</TooltipContent>
                </UiTooltip>
              </TooltipProvider>
            </div>
            <div className="grid gap-8 lg:grid-cols-[minmax(270px,340px)_1fr]">
              <ScenarioForm s={s} data={data} update={update} />
              <SimulationResults
                s={s}
                scenarios={scenarios}
                compare={compare}
                setCompare={setCompare}
                update={update}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
}
