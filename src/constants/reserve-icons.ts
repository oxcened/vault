export const RESERVE_ICON_NAMES = [
  "shield",
  "emergency",
  "taxes",
  "home",
  "travel",
  "technology",
  "gift",
  "savings",
] as const;

export type ReserveIconName = (typeof RESERVE_ICON_NAMES)[number];

export const DEFAULT_RESERVE_ICON: ReserveIconName = "shield";
