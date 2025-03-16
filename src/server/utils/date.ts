export function earliestDateOptional(
  date1?: Date,
  date2?: Date,
): Date | undefined {
  if (!date1 && !date2) return undefined;
  if (!date1) return date2;
  if (!date2) return date1;
  return date1 < date2 ? date1 : date2;
}
