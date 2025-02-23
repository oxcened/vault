let defaultDateOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
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
