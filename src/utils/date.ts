import { set } from "date-fns";

const defaultDateOptions: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
};

export type FormatDateParams = {
  date: Date;
  options?: Intl.DateTimeFormatOptions;
};

export function formatDate({ date, options }: FormatDateParams): string {
  return new Intl.DateTimeFormat(navigator.language || "en-US", {
    ...defaultDateOptions,
    ...options,
  }).format(date);
}

export function localTimeToUTCTime({ date }: { date: Date }) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
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
