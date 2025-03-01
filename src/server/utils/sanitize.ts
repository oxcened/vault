// This is due to routes' inputs using undefined to signal missing value
// but Prisma using null to do so
// We also make sure to convert empty strings
export function sanitizeOptionalString(value?: string): string | null {
  if (value === undefined) return null;
  if (value === "") return null;
  return value;
}
