"use client";

import { COST_COLOR_SCALE, calculateCostThresholds } from "@/lib/cost-colors";

interface CostScaleLegendProps {
  minCost: number;
  maxCost: number;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export function CostScaleLegend({ minCost, maxCost }: CostScaleLegendProps) {
  // Handle edge case where min equals max
  if (minCost === maxCost) {
    return (
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2">
        <div className="text-xs font-semibold text-gray-700 mb-1">
          Cost per District
        </div>
        <div className="text-sm text-gray-600">{formatCurrency(minCost)}</div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2">
      <div className="text-xs font-semibold text-gray-700 mb-2">
        Cost per District
      </div>

      {/* Gradient bar */}
      <div className="flex h-3 rounded-sm overflow-hidden mb-1 w-32">
        {COST_COLOR_SCALE.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-gray-600 w-32">
        <span>{formatCurrency(minCost)}</span>
        <span>{formatCurrency(maxCost)}</span>
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 mt-0.5 w-32">
        <span>Cheapest</span>
        <span>Most Expensive</span>
      </div>
    </div>
  );
}
