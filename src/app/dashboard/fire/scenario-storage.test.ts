import { describe, expect, test } from "vitest";
import { loadScenarios, saveScenarios } from "./scenario-storage";
import { makeScenario } from "./scenario";

function memoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key) => {
      entries.delete(key);
    },
    setItem: (key, value) => {
      entries.set(key, value);
    },
  };
}

describe("scenario storage", () => {
  test("round trips scenarios without mixing users", () => {
    const storage = memoryStorage();
    const scenario = { ...makeScenario(123, 45, 67), name: "First" };
    const fallback = makeScenario(0, 0, 0);
    saveScenarios(storage, "alice", [scenario]);
    expect(loadScenarios(storage, "alice", fallback)).toEqual([scenario]);
    expect(loadScenarios(storage, "bob", fallback)).toEqual([fallback]);
  });
  test("ignores incomplete scenarios and keeps valid ones", () => {
    const storage = memoryStorage();
    const valid = makeScenario(1, 2, 3);
    storage.setItem(
      "vault:fire:scenarios:v1:alice",
      JSON.stringify([
        { id: "invalid", age: "30", phases: [], events: [] },
        valid,
      ]),
    );
    expect(loadScenarios(storage, "alice", makeScenario(0, 0, 0))).toEqual([
      valid,
    ]);
  });
  test("returns a fallback for non-array or empty saved data", () => {
    const storage = memoryStorage(),
      fallback = makeScenario(0, 0, 0);
    storage.setItem("vault:fire:scenarios:v1:alice", "{}");
    expect(loadScenarios(storage, "alice", fallback)).toEqual([fallback]);
  });
});
