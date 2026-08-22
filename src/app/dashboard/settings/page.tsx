import Link from "next/link";
import {
  BadgeEuro,
  ChartNoAxesCombined,
  ChevronRight,
  Database,
  ListTree,
  ReceiptText,
  Shapes,
  Tags,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";

type SettingsItem = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const sections: {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  glowClassName: string;
  items: SettingsItem[];
}[] = [
  {
    title: "Financial data",
    eyebrow: "Markets & pricing",
    description: "Reference data used for valuations and currency conversion.",
    icon: Database,
    iconClassName: "bg-blue-500/10 text-blue-500 ring-blue-500/20",
    glowClassName: "bg-blue-500/10",
    items: [
      {
        title: "Exchange rates",
        description: "Manage currency conversion rates.",
        href: "/dashboard/market-data/exchange-rates",
        icon: BadgeEuro,
      },
      {
        title: "Stock prices",
        description: "Review and update historical market prices.",
        href: "/dashboard/market-data/stock-prices",
        icon: ChartNoAxesCombined,
      },
      {
        title: "Stock tickers",
        description: "Configure the securities tracked by Vault.",
        href: "/dashboard/settings/stock-tickers",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Organization",
    eyebrow: "Rules & structure",
    description: "Control how transactions and holdings are organized.",
    icon: Shapes,
    iconClassName: "bg-violet-500/10 text-violet-500 ring-violet-500/20",
    glowClassName: "bg-violet-500/10",
    items: [
      {
        title: "Transaction presets",
        description: "Create reusable transaction templates.",
        href: "/dashboard/settings/transaction-templates",
        icon: ReceiptText,
      },
      {
        title: "Transaction categories",
        description: "Organize income and expenses.",
        href: "/dashboard/settings/transaction-categories",
        icon: Tags,
      },
      {
        title: "Net worth categories",
        description: "Group assets and debts consistently.",
        href: "/dashboard/settings/net-worth-categories",
        icon: ListTree,
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-6 p-5 py-8 md:p-8 lg:py-10">
        <div className="px-1">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage the data and organization behind your finances.
          </p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.title}
              className="relative overflow-hidden rounded-2xl border bg-card/50 p-2 shadow-sm"
            >
              <div
                className={`absolute -right-16 -top-16 size-40 rounded-full blur-3xl ${section.glowClassName}`}
              />
              <div className="relative flex items-start gap-4 px-4 pb-5 pt-4">
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${section.iconClassName}`}
                >
                  <section.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {section.eyebrow}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="relative flex flex-col gap-1.5">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex min-h-[76px] items-center gap-3 rounded-xl border border-transparent bg-background/55 px-3.5 py-3 transition-all duration-200 hover:border-border hover:bg-background hover:shadow-sm"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground transition-colors group-hover:border-blue-500/20 group-hover:bg-blue-500/10 group-hover:text-blue-500">
                      <item.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground/60 transition-colors group-hover:bg-muted group-hover:text-foreground">
                      <ChevronRight className="block size-4 transition-transform group-hover:translate-x-px" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
