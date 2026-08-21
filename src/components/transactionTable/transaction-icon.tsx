import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Building2,
  BriefcaseBusiness,
  BusFront,
  Clapperboard,
  CircleHelp,
  CreditCard,
  Gift,
  Heart,
  House,
  KeyRound,
  Landmark,
  Laptop,
  Plane,
  PiggyBank,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  ShoppingBasket,
  TrendingUp,
  Utensils,
  Wrench,
} from "lucide-react";
import { cn } from "~/lib/utils";

type TransactionIconProps = {
  category: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  isRefund?: boolean;
};

type IconConfig = {
  icon: LucideIcon;
  className: string;
  accent: string;
};

const categoryIcons: Array<{
  keywords: string[];
  config: IconConfig;
}> = [
  {
    keywords: ["grocer", "groceries", "household", "supermarket", "food"],
    config: {
      icon: ShoppingBasket,
      className: "bg-amber-500/10 text-amber-500",
      accent: "#f59e0b",
    },
  },
  {
    keywords: ["eating out", "bar", "restaurant", "dining", "cafe", "coffee"],
    config: {
      icon: Utensils,
      className: "bg-orange-500/10 text-orange-500",
      accent: "#f97316",
    },
  },
  {
    keywords: ["housing", "rent", "home", "mortgage", "utilities"],
    config: {
      icon: House,
      className: "bg-blue-500/10 text-blue-500",
      accent: "#3b82f6",
    },
  },
  {
    keywords: ["transport", "mobility", "car", "fuel"],
    config: {
      icon: BusFront,
      className: "bg-sky-500/10 text-sky-500",
      accent: "#0ea5e9",
    },
  },
  {
    keywords: ["travel", "holiday", "holidays", "vacation"],
    config: {
      icon: Plane,
      className: "bg-cyan-500/10 text-cyan-500",
      accent: "#06b6d4",
    },
  },
  {
    keywords: ["tools & subscriptions", "tools and subscriptions"],
    config: {
      icon: Wrench,
      className: "bg-indigo-500/10 text-indigo-500",
      accent: "#6366f1",
    },
  },
  {
    keywords: ["entertainment", "cinema", "movie", "subscription"],
    config: {
      icon: Clapperboard,
      className: "bg-violet-500/10 text-violet-500",
      accent: "#8b5cf6",
    },
  },
  {
    keywords: ["salary", "paycheck", "work"],
    config: {
      icon: BriefcaseBusiness,
      className: "bg-emerald-500/10 text-emerald-500",
      accent: "#10b981",
    },
  },
  {
    keywords: ["freelance", "side hustle", "side hustles"],
    config: {
      icon: Laptop,
      className: "bg-cyan-500/10 text-cyan-500",
      accent: "#06b6d4",
    },
  },
  {
    keywords: ["personal care", "health", "wellness", "medical", "fitness"],
    config: {
      icon: Heart,
      className: "bg-pink-500/10 text-pink-500",
      accent: "#ec4899",
    },
  },
  {
    keywords: ["gift", "gifts", "donation", "donations", "charity"],
    config: {
      icon: Gift,
      className: "bg-rose-500/10 text-rose-500",
      accent: "#f43f5e",
    },
  },
  {
    keywords: ["shopping"],
    config: {
      icon: ShoppingBag,
      className: "bg-fuchsia-500/10 text-fuchsia-500",
      accent: "#d946ef",
    },
  },
  {
    keywords: [
      "financial fee",
      "financial fees",
      "bank fee",
      "bank fees",
      "charge",
      "charges",
    ],
    config: {
      icon: CreditCard,
      className: "bg-slate-500/10 text-slate-500",
      accent: "#64748b",
    },
  },
  {
    keywords: ["tax", "taxes", "contribution", "contributions"],
    config: {
      icon: Landmark,
      className: "bg-stone-500/10 text-stone-500",
      accent: "#78716c",
    },
  },
  {
    keywords: ["other", "unexpected"],
    config: {
      icon: CircleHelp,
      className: "bg-neutral-500/10 text-neutral-500",
      accent: "#737373",
    },
  },
  {
    keywords: ["business income"],
    config: {
      icon: Building2,
      className: "bg-indigo-500/10 text-indigo-500",
      accent: "#6366f1",
    },
  },
  {
    keywords: ["investment", "investments", "dividend", "dividends"],
    config: {
      icon: TrendingUp,
      className: "bg-teal-500/10 text-teal-500",
      accent: "#14b8a6",
    },
  },
  {
    keywords: ["pension", "retirement"],
    config: {
      icon: PiggyBank,
      className: "bg-lime-500/10 text-lime-500",
      accent: "#84cc16",
    },
  },
  {
    keywords: ["rental income"],
    config: {
      icon: KeyRound,
      className: "bg-yellow-500/10 text-yellow-500",
      accent: "#eab308",
    },
  },
];

const fallbackIcon: IconConfig = {
  icon: ReceiptText,
  className: "bg-muted text-muted-foreground",
  accent: "#737373",
};

function includesKeyword(category: string, keyword: string) {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escapedKeyword}(?:$|[^a-z0-9])`).test(
    category,
  );
}

function getIconConfig({
  category,
  type,
  isRefund,
}: TransactionIconProps): IconConfig {
  if (type === "TRANSFER") {
    return {
      icon: ArrowLeftRight,
      className: "bg-blue-500/10 text-blue-500",
      accent: "#3b82f6",
    };
  }

  if (isRefund) {
    return {
      icon: RotateCcw,
      className: "bg-emerald-500/10 text-emerald-500",
      accent: "#10b981",
    };
  }

  const normalizedCategory = category.toLocaleLowerCase();
  return (
    categoryIcons.find(({ keywords }) =>
      keywords.some((keyword) => includesKeyword(normalizedCategory, keyword)),
    )?.config ?? fallbackIcon
  );
}

export function getTransactionAccent(props: TransactionIconProps) {
  return getIconConfig(props).accent;
}

export function TransactionIcon(props: TransactionIconProps) {
  const { icon: Icon, className } = getIconConfig(props);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
