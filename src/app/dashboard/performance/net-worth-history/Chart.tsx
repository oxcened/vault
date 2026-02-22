import Decimal from "decimal.js";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { APP_CURRENCY } from "~/constants";
import { calculateZeroInclusiveYAxisDomain } from "~/utils/chart";
import { formatDate } from "~/utils/date";
import { formatNumber } from "~/utils/number";

type ChartDataItem = {
  id: string;
  timestamp: Date;
  netValue: Decimal;
  totalAssets: Decimal;
  totalDebts: Decimal;
};

const netWorthChartConfig: ChartConfig = {
  netWorth: {
    label: "Net worth",
    color: "var(--chart-3)",
  },
  totalAssets: {
    label: "Assets",
    color: "var(--chart-1)",
  },
  totalDebts: {
    label: "Debts",
    color: "var(--chart-2)",
  },
};

export function Chart({ data }: { data: ChartDataItem[] }) {
  const chartData = data.map((nw) => ({
    month: formatDate({
      date: nw.timestamp,
      options: {
        dateStyle: undefined,
        month: "short",
        year: "2-digit",
      },
    }),
    netWorth: nw.netValue.toNumber(),
    totalAssets: nw.totalAssets.toNumber(),
    totalDebts: nw.totalDebts.toNumber(),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net worth history</CardTitle>
        <CardDescription>All time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={netWorthChartConfig}
          className="h-[15rem] w-full"
        >
          <ComposedChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={calculateZeroInclusiveYAxisDomain}
              tickFormatter={(value: number) =>
                formatNumber({
                  value,
                  options: {
                    style: "currency",
                    currency: APP_CURRENCY,
                    maximumFractionDigits: 0,
                  },
                })
              }
            />

            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

            <Bar
              dataKey="totalAssets"
              fill="var(--color-totalAssets)"
              barSize={30}
              radius={4}
              name="Assets"
            />

            <Bar
              dataKey="totalDebts"
              fill="var(--color-totalDebts)"
              barSize={30}
              radius={4}
              name="Debts"
            />

            <Line
              dataKey="netWorth"
              type="monotone"
              stroke="var(--color-netWorth)"
              strokeWidth={3}
              dot={false}
              name="Net worth"
            />

            <Legend />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
