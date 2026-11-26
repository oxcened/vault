import { describe, expect, it } from "vitest";
import {
  toMonthTimestamp,
  toMonthTimestampEnd,
  toNextMonthTimestamp,
  mergeDateAndTime,
} from "./date";

describe("financial snapshot dates", () => {
  it("normalizes UTC months and handles year rollover", () => {
    const date = new Date("2024-12-31T23:59:59.000Z");
    expect(toMonthTimestamp(date).toISOString()).toBe(
      "2024-12-01T00:00:00.000Z",
    );
    expect(toNextMonthTimestamp(date).toISOString()).toBe(
      "2025-01-01T00:00:00.000Z",
    );
  });
  it("handles the last day of leap February", () => {
    expect(
      toMonthTimestampEnd(new Date("2024-02-15T00:00:00.000Z")).toISOString(),
    ).toBe("2024-02-29T00:00:00.000Z");
  });
  it("merges the selected day with the existing local time without mutating inputs", () => {
    const day = new Date(2025, 3, 5, 10),
      time = new Date(2020, 8, 1, 14, 22, 33, 444);
    const merged = mergeDateAndTime(day, time);
    expect([
      merged.getFullYear(),
      merged.getMonth(),
      merged.getDate(),
      merged.getHours(),
      merged.getMinutes(),
      merged.getSeconds(),
      merged.getMilliseconds(),
    ]).toEqual([2025, 3, 5, 14, 22, 33, 444]);
    expect(day.getHours()).toBe(10);
  });
});
