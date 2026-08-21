import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BriefcaseBusiness,
  Building2,
  CarFront,
  ChartCandlestick,
  CircleHelp,
  Clock3,
  Coins,
  CreditCard,
  Gem,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  Lightbulb,
  PiggyBank,
  ReceiptText,
  ScrollText,
  ShoppingBag,
} from "lucide-react";
import { cn } from "~/lib/utils";

type HoldingIconProps = {
  category: string;
  type: "asset" | "debt";
};

type IconConfig = {
  icon: LucideIcon;
  className: string;
};

const categoryIcons: Array<{
  keywords: string[];
  config: IconConfig;
}> = [
  {
    keywords: ["cash"],
    config: { icon: Banknote, className: "bg-emerald-500/10 text-emerald-500" },
  },
  {
    keywords: ["bank account"],
    config: { icon: Landmark, className: "bg-blue-500/10 text-blue-500" },
  },
  {
    keywords: ["stock"],
    config: {
      icon: ChartCandlestick,
      className: "bg-violet-500/10 text-violet-500",
    },
  },
  {
    keywords: ["bond"],
    config: { icon: ScrollText, className: "bg-cyan-500/10 text-cyan-500" },
  },
  {
    keywords: ["retirement"],
    config: { icon: PiggyBank, className: "bg-lime-500/10 text-lime-500" },
  },
  {
    keywords: ["real estate", "mortgage", "home equity", "heloc"],
    config: { icon: House, className: "bg-sky-500/10 text-sky-500" },
  },
  {
    keywords: ["vehicle", "car loan", "auto lease"],
    config: { icon: CarFront, className: "bg-orange-500/10 text-orange-500" },
  },
  {
    keywords: ["collectible"],
    config: { icon: Gem, className: "bg-fuchsia-500/10 text-fuchsia-500" },
  },
  {
    keywords: ["business interest", "business loan"],
    config: {
      icon: BriefcaseBusiness,
      className: "bg-indigo-500/10 text-indigo-500",
    },
  },
  {
    keywords: ["intellectual property"],
    config: { icon: Lightbulb, className: "bg-yellow-500/10 text-yellow-500" },
  },
  {
    keywords: ["student loan"],
    config: {
      icon: GraduationCap,
      className: "bg-purple-500/10 text-purple-500",
    },
  },
  {
    keywords: ["credit card"],
    config: { icon: CreditCard, className: "bg-rose-500/10 text-rose-500" },
  },
  {
    keywords: ["personal loan"],
    config: { icon: HandCoins, className: "bg-amber-500/10 text-amber-500" },
  },
  {
    keywords: ["retail financing"],
    config: { icon: ShoppingBag, className: "bg-pink-500/10 text-pink-500" },
  },
  {
    keywords: ["medical debt"],
    config: { icon: HeartPulse, className: "bg-red-500/10 text-red-500" },
  },
  {
    keywords: ["tax liabilit"],
    config: { icon: ReceiptText, className: "bg-stone-500/10 text-stone-500" },
  },
  {
    keywords: ["short-term debt"],
    config: { icon: Clock3, className: "bg-slate-500/10 text-slate-500" },
  },
];

const fallbackIcons: Record<HoldingIconProps["type"], IconConfig> = {
  asset: { icon: Coins, className: "bg-blue-500/10 text-blue-500" },
  debt: { icon: Building2, className: "bg-rose-500/10 text-rose-500" },
};

export function HoldingIcon({ category, type }: HoldingIconProps) {
  const normalizedCategory = category.toLocaleLowerCase();
  const config =
    categoryIcons.find(({ keywords }) =>
      keywords.some((keyword) => normalizedCategory.includes(keyword)),
    )?.config ?? fallbackIcons[type];
  const Icon = config.icon ?? CircleHelp;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        config.className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
