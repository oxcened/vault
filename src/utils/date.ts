import { set } from "date-fns";

const defaultDateOptions: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
};

export type FormatDateParams = {
  date: Date;
  options?: Intl.DateTimeFormatOptions;
};

export function formatDate({ date, options }: FormatDateParams): string {
  const locale =
    typeof navigator === "undefined" ? "en-US" : navigator.language || "en-US";

  return new Intl.DateTimeFormat(locale, options ?? defaultDateOptions).format(
    date,
  );
}

export function localTimeToUTCTime({ date }: { date: Date }) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

/** Returns the canonical UTC timestamp used for a monthly snapshot. */
export function toMonthTimestamp(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function toMonthTimestampEnd(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

export function toNextMonthTimestamp(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

/**
 * Returns a new Date combining the date from `daySource` and the time from `timeSource`.
 * @param daySource - The date from which to extract the year, month, and day.
 * @param timeSource - The date from which to extract the hours, minutes, seconds, and milliseconds.
 */
export function mergeDateAndTime(daySource: Date, timeSource: Date): Date {
  return set(daySource, {
    hours: timeSource.getHours(),
    minutes: timeSource.getMinutes(),
    seconds: timeSource.getSeconds(),
    milliseconds: timeSource.getMilliseconds(),
  });
}
