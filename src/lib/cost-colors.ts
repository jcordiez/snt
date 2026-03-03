// Cost color scale: Green (cheapest) -> Red (most expensive)
// 6 steps for discrete color classification

export const COST_COLOR_SCALE = [
  "#22c55e", // green-500 (cheapest)
  "#84cc16", // lime-500
  "#eab308", // yellow-500
  "#f97316", // orange-500
  "#ef4444", // red-500
  "#dc2626", // red-600 (most expensive)
];

export interface CostThresholds {
  min: number;
  max: number;
  thresholds: number[]; // 5 threshold values for 6 buckets
}

/**
 * Calculate thresholds for 6-bucket cost classification
 * Uses equal intervals between min and max
 */
export function calculateCostThresholds(
  minCost: number,
  maxCost: number
): CostThresholds {
  const range = maxCost - minCost;
  const step = range / 6;

  return {
    min: minCost,
    max: maxCost,
    thresholds: [
      minCost + step,
      minCost + step * 2,
      minCost + step * 3,
      minCost + step * 4,
      minCost + step * 5,
    ],
  };
}

/**
 * Get the color for a given cost value
 */
export function getCostColor(cost: number, thresholds: CostThresholds): string {
  if (cost <= thresholds.thresholds[0]) return COST_COLOR_SCALE[0];
  if (cost <= thresholds.thresholds[1]) return COST_COLOR_SCALE[1];
  if (cost <= thresholds.thresholds[2]) return COST_COLOR_SCALE[2];
  if (cost <= thresholds.thresholds[3]) return COST_COLOR_SCALE[3];
  if (cost <= thresholds.thresholds[4]) return COST_COLOR_SCALE[4];
  return COST_COLOR_SCALE[5];
}

/**
 * Build a MapLibre step expression for cost-based coloring
 */
export function buildCostColorExpression(
  thresholds: CostThresholds
): maplibregl.ExpressionSpecification {
  return [
    "step",
    ["get", "districtCost"],
    COST_COLOR_SCALE[0], // Default (below first threshold)
    thresholds.thresholds[0],
    COST_COLOR_SCALE[1],
    thresholds.thresholds[1],
    COST_COLOR_SCALE[2],
    thresholds.thresholds[2],
    COST_COLOR_SCALE[3],
    thresholds.thresholds[3],
    COST_COLOR_SCALE[4],
    thresholds.thresholds[4],
    COST_COLOR_SCALE[5],
  ] as maplibregl.ExpressionSpecification;
}
