"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CategoryCost {
  categoryId: number;
  categoryName: string;
  totalCost: number;
}

interface CategoryPieChartProps {
  categoryCosts: CategoryCost[];
}

const COLORS = [
  "hsl(12, 76%, 61%)",   // chart-1
  "hsl(173, 58%, 39%)",  // chart-2
  "hsl(197, 37%, 24%)",  // chart-3
  "hsl(43, 74%, 66%)",   // chart-4
  "hsl(27, 87%, 67%)",   // chart-5
  "hsl(220, 70%, 50%)",  // Additional colors
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
      .map((c) => ({
        name: c.categoryName,
        value: c.totalCost,
      }));
  }, [categoryCosts]);

  const totalCost = useMemo(() => {
    return data.reduce((sum, d) => sum + d.value, 0);
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
      <h3 className="text-sm font-semibold mb-4">Costs by Category</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const numValue = typeof value === "number" ? value : 0;
                return [
                  `${formatCurrency(numValue)} (${((numValue / totalCost) * 100).toFixed(1)}%)`,
                  "Cost",
                ];
              }}
            />
            <Legend
              verticalAlign="bottom"
              formatter={(value) => {
                const item = data.find((d) => d.name === value);
                return (
                  <span className="text-xs">
                    {value} - {item ? formatCurrency(item.value) : ""}
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
