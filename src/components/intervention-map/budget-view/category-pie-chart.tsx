"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface CategoryCost {
  categoryId: number;
  categoryName: string;
  totalCost: number;
}

interface CategoryPieChartProps {
  categoryCosts: CategoryCost[];
}

const COLORS = [
  "hsl(12, 76%, 61%)",
  "hsl(173, 58%, 39%)",
  "hsl(197, 37%, 24%)",
  "hsl(43, 74%, 66%)",
  "hsl(27, 87%, 67%)",
  "hsl(220, 70%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(280, 65%, 55%)",
];

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

export function CategoryPieChart({ categoryCosts }: CategoryPieChartProps) {
  const data = useMemo(() => {
    return categoryCosts
      .filter((c) => c.totalCost > 0)
      .map((c, index) => ({
        name: c.categoryName,
        value: c.totalCost,
        fill: COLORS[index % COLORS.length],
      }));
  }, [categoryCosts]);

  const totalCost = useMemo(() => {
    return data.reduce((sum, d) => sum + d.value, 0);
  }, [data]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((d, index) => {
      config[d.name] = {
        label: d.name,
        color: COLORS[index % COLORS.length],
      };
    });
    return config;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No cost data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
       <div className="flex-1 min-h-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={100}
              outerRadius={200}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="name"
                  formatter={(value, name) => {
                    const numValue = typeof value === "number" ? value : 0;
                    const percentage = ((numValue / totalCost) * 100).toFixed(1);
                    return (
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-mono font-medium">
                          {formatCurrency(numValue)} ({percentage}%)
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <ChartLegend
              verticalAlign="bottom"
              content={<ChartLegendContent nameKey="name" />}
            />
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  );
}
