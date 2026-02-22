"use client";

import { getCoreRowModel } from "@tanstack/react-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { api } from "~/trpc/react";
import { netWorthColumns } from "./config";
import { TableSkeleton } from "~/components/table-skeleton";
import { DataTable } from "~/components/ui/data-table";
import { DataTableColumns } from "~/components/ui/data-table-columns";
import { useTable } from "~/hooks/useTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "~/components/ui/select";
import { isAfter, subYears } from "date-fns";

type Tab = "TABLE" | "CHART";
type TimeframeId = "1Y" | "3Y" | "5Y" | "All";
type Timeframe = {
  id: TimeframeId;
  label: string;
  fromDate?: Date;
};

const chartTimeframes: Timeframe[] = [
  {
    id: "1Y",
    label: "Last year",
    fromDate: subYears(new Date(), 1),
  },
  {
    id: "3Y",
    label: "Last 3 years",
    fromDate: subYears(new Date(), 3),
  },
  {
    id: "5Y",
    label: "Last 5 years",
    fromDate: subYears(new Date(), 5),
  },
  {
    id: "All",
    label: "All time",
    fromDate: undefined,
  },
] as const;

function findStartIndex(
  arr: {
    timestamp: Date;
  }[],
  cutoff: Date,
) {
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (!arr[mid]) continue;
    if (arr[mid].timestamp < cutoff) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
}

export default function NwHistoryPage() {
  const { data = [], isPending } = api.netWorth.getAll.useQuery();
  const [tab, setTab] = useState<Tab>("TABLE");
  const [chartTimeframe, setChartTimeframe] = useState<TimeframeId>("All");

  const table = useTable({
    data,
    columns: netWorthColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      id: "netWorthHistory",
    },
  });

  const chartData = useMemo(() => {
    const startingData = data.toReversed();
    const timeframe = chartTimeframes.find(
      (timeframe) => timeframe.id === chartTimeframe,
    );
    if (!timeframe?.fromDate) return startingData;
    const startIndex = findStartIndex(startingData, timeframe?.fromDate);
    return startingData.slice(startIndex);
  }, [data, chartTimeframe]);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbPage>Performance & History</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Net worth history</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-2 p-5">
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <div className="flex justify-between">
            <TabsList>
              <TabsTrigger value={"TABLE" satisfies Tab}>Table</TabsTrigger>
              <TabsTrigger value={"CHART" satisfies Tab}>Chart</TabsTrigger>
            </TabsList>

            {tab === "TABLE" && (
              <DataTableColumns table={table} className="self-end" />
            )}

            {tab === "CHART" && (
              <Select
                value={chartTimeframe}
                onValueChange={(value) =>
                  setChartTimeframe(value as TimeframeId)
                }
              >
                <SelectTrigger className="w-fit">
                  <SelectValue placeholder="Select a time frame" />
                </SelectTrigger>

                <SelectContent>
                  {chartTimeframes.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <TabsContent value={"TABLE" satisfies Tab}>
            {isPending ? <TableSkeleton /> : <DataTable table={table} />}
          </TabsContent>

          <TabsContent value={"CHART" satisfies Tab} className="mt-5">
            <Chart data={chartData} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
