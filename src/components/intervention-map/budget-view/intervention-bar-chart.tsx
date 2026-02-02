"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface InterventionCost {
  interventionId: number;
  interventionName: string;
  shortName: string;
  procurement: number;
  distribution: number;
  support: number;
  totalCost: number;
}

interface InterventionBarChartProps {
  interventionCosts: InterventionCost[];
}

const chartConfig = {
  procurement: {
    label: "Procurement",
    color: "hsl(12, 76%, 61%)",
  },
  distribution: {
    label: "Distribution",
    color: "hsl(173, 58%, 39%)",
  },
  support: {
    label: "Support",
    color: "hsl(43, 74%, 66%)",
  },
} satisfies ChartConfig;

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export function InterventionBarChart({
  interventionCosts,
}: InterventionBarChartProps) {
  const data = useMemo(() => {
    return interventionCosts
      .filter((i) => i.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost)
      .map((i) => ({
        name: i.shortName || i.interventionName,
        fullName: i.interventionName,
        procurement: i.procurement,
        distribution: i.distribution,
        support: i.support,
        total: i.totalCost,
      }));
  }, [interventionCosts]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No cost data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold mb-4">Detailed Intervention Costs</h3>
      <div className="flex-1 min-h-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 80, left: 10, bottom: 10 }}
          >
            <XAxis
              type="number"
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    if (payload && payload.length > 0) {
                      const item = payload[0].payload;
                      return `${item.fullName} - Total: ${formatCurrency(item.total)}`;
                    }
                    return "";
                  }}
                  formatter={(value, name) => {
                    const numValue = typeof value === "number" ? value : 0;
                    return (
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label || name}
                        </span>
                        <span className="font-mono font-medium">
                          {formatCurrency(numValue)}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="procurement"
              stackId="a"
              fill="var(--color-procurement)"
            />
            <Bar
              dataKey="distribution"
              stackId="a"
              fill="var(--color-distribution)"
            />
            <Bar
              dataKey="support"
              stackId="a"
              fill="var(--color-support)"
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
