import {
  Gift,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  PiggyBank,
  Plane,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  DEFAULT_RESERVE_ICON,
  type ReserveIconName,
} from "~/constants/reserve-icons";
import { cn } from "~/lib/utils";

export const reserveIconOptions: Array<{
  name: ReserveIconName;
  label: string;
  icon: LucideIcon;
}> = [
  { name: "shield", label: "General", icon: ShieldCheck },
  { name: "emergency", label: "Emergency", icon: HeartPulse },
  { name: "taxes", label: "Taxes", icon: Landmark },
  { name: "home", label: "Home", icon: House },
  { name: "travel", label: "Travel", icon: Plane },
  { name: "technology", label: "Technology", icon: Laptop },
  { name: "gift", label: "Gifts", icon: Gift },
  { name: "savings", label: "Savings", icon: PiggyBank },
];

export function ReserveIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const option = reserveIconOptions.find((item) => item.name === name);
  const Icon = option?.icon ?? ShieldCheck;

  return <Icon className={cn("size-5", className)} />;
}

export function normalizeReserveIcon(name?: string | null): ReserveIconName {
  return reserveIconOptions.some((option) => option.name === name)
    ? (name as ReserveIconName)
    : DEFAULT_RESERVE_ICON;
}
