"use client";

import { useEffect, useState } from "react";
import { type RouterOutputs } from "~/trpc/react";
import { makeScenario, type Scenario } from "./scenario";
import { loadScenarios, saveScenarios } from "./scenario-storage";

type Summary = RouterOutputs["dashboard"]["getSummary"] | undefined;

export function useScenarios(userId: string | undefined, summary: Summary) {
  const [loadedUser, setLoadedUser] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selected, setSelected] = useState("");
  const [compare, setCompare] = useState<string[]>([]);

  useEffect(() => {
    if (!userId || !summary?.firePortfolio || loadedUser === userId) return;
    const fallback = makeScenario(
      summary.firePortfolio.toNumber(),
      Math.max(0, summary.cashFlowAvgLast6Months.netFlow?.toNumber() ?? 0),
      Math.max(0, summary.cashFlowAvgLast6Months.expenses?.toNumber() ?? 0),
    );
    let list: Scenario[];
    try {
      list = loadScenarios(window.localStorage, userId, fallback);
    } catch {
      list = [fallback];
    }
    setScenarios(list);
    setSelected(list[0]!.id);
    setCompare([]);
    setLoadedUser(userId);
  }, [userId, summary, loadedUser]);

  useEffect(() => {
    if (!userId || loadedUser !== userId) return;
    try {
      saveScenarios(window.localStorage, userId, scenarios);
    } catch {
      /* Storage may be unavailable. */
    }
  }, [userId, loadedUser, scenarios]);

  const scenario = scenarios.find((item) => item.id === selected);
  const update = (patch: Partial<Scenario>) =>
    setScenarios((items) =>
      items.map((item) =>
        item.id === selected ? { ...item, ...patch } : item,
      ),
    );
  return {
    isLoaded: !!userId && loadedUser === userId,
    scenarios,
    setScenarios,
    selected,
    setSelected,
    compare,
    setCompare,
    scenario,
    update,
  };
}
