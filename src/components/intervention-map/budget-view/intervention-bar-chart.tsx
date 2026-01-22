"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

const COST_COLORS = {
  procurement: "hsl(12, 76%, 61%)",
  distribution: "hsl(173, 58%, 39%)",
  support: "hsl(43, 74%, 66%)",
};

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
        <ResponsiveContainer width="100%" height="100%">
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
            <Tooltip
              formatter={(value, name) => {
                const numValue = typeof value === "number" ? value : 0;
                const strName = String(name);
                return [
                  formatCurrency(numValue),
                  strName.charAt(0).toUpperCase() + strName.slice(1),
                ];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  const item = payload[0].payload;
                  return `${item.fullName} - Total: ${formatCurrency(item.total)}`;
                }
                return String(label);
              }}
            />
            <Legend
              formatter={(value) =>
                value.charAt(0).toUpperCase() + value.slice(1)
              }
            />
            <Bar
              dataKey="procurement"
              stackId="a"
              fill={COST_COLORS.procurement}
            />
            <Bar
              dataKey="distribution"
              stackId="a"
              fill={COST_COLORS.distribution}
            />
            <Bar
              dataKey="support"
              stackId="a"
              fill={COST_COLORS.support}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
