"use client";

import { memo, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { PlanDefinition } from "@/data/predefined-plans";
import { usePlanDistricts } from "./use-plan-districts";
import {
  INTERVENTION_COSTS,
  DEFAULT_COST,
  getTotalCost,
} from "@/components/intervention-map/budget-view/cost-data";

const COLORS = [
  "hsl(12, 76%, 61%)",
  "hsl(173, 58%, 39%)",
  "hsl(197, 37%, 24%)",
  "hsl(43, 74%, 66%)",
  "hsl(27, 87%, 67%)",
  "hsl(220, 70%, 50%)",
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

interface MiniatureBudgetProps {
  plan: PlanDefinition;
}

export const MiniatureBudget = memo(function MiniatureBudget({ plan }: MiniatureBudgetProps) {
  const { planDistricts, interventionCategories } = usePlanDistricts(plan);

  // Build intervention lookup
  const interventionLookup = useMemo(() => {
    if (!interventionCategories) return new Map();
    const lookup = new Map<number, { categoryId: number; categoryName: string }>();
    for (const category of interventionCategories) {
      for (const intervention of category.interventions) {
        lookup.set(intervention.id, {
          categoryId: category.id,
          categoryName: category.name,
        });
      }
    }
    return lookup;
  }, [interventionCategories]);

  // Calculate costs per category
  const { categoryCosts, totalCost } = useMemo(() => {
    if (!planDistricts) return { categoryCosts: [], totalCost: 0 };

    const categoryMap = new Map<number, { name: string; cost: number }>();
    let total = 0;

    for (const feature of planDistricts.features) {
      const assignments = feature.properties.interventionCategoryAssignments || {};

      for (const [, interventionId] of Object.entries(assignments)) {
        const id = interventionId as number;
        const info = interventionLookup.get(id);
        if (!info) continue;

        const costs = INTERVENTION_COSTS[id] || DEFAULT_COST;
        const cost = getTotalCost(costs);
        total += cost;

        if (categoryMap.has(info.categoryId)) {
          categoryMap.get(info.categoryId)!.cost += cost;
        } else {
          categoryMap.set(info.categoryId, {
            name: info.categoryName,
            cost,
          });
        }
      }
    }

    const costs = Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        categoryId: id,
        name: data.name,
        value: data.cost,
      }))
      .filter((c) => c.value > 0);

    return { categoryCosts: costs, totalCost: total };
  }, [planDistricts, interventionLookup]);

  if (!planDistricts) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-2">
       {/* Total cost */}
       <div className="text-center pb-1">
        <span className="text-lg font-bold">{formatCurrency(totalCost)}</span>
      </div>
      {/* Pie chart */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryCosts}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {categoryCosts.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

     
    </div>
  );
});
