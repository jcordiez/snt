// Mock cost data per intervention per district (from PRD)
// Maps intervention ID to cost breakdown

export interface CostBreakdown {
  procurement: number;
  distribution: number;
  support: number;
}

export const INTERVENTION_COSTS: Record<number, CostBreakdown> = {
  // CM (Case Management) - Category 37, Intervention 78
  78: { procurement: 50000, distribution: 45000, support: 30000 },
  // IPTp - Category 38, Intervention 79
  79: { procurement: 25000, distribution: 15000, support: 10000 },
  // SMC - Category 38, Intervention 80
  80: { procurement: 40000, distribution: 30000, support: 15000 },
  // PMC - Category 38, Intervention 81
  81: { procurement: 35000, distribution: 25000, support: 12000 },
  // Dual AI LLIN - Category 39, Intervention 82
  82: { procurement: 80000, distribution: 50000, support: 20000 },
  // PBO LLIN - Category 39, Intervention 83
  83: { procurement: 60000, distribution: 40000, support: 18000 },
  // IG2 IRS - Category 39, Intervention 84
  84: { procurement: 100000, distribution: 70000, support: 35000 },
  // Standard Pyrethroid Campaign - Category 40, Intervention 85
  85: { procurement: 55000, distribution: 35000, support: 15000 },
  // PBO Campaign - Category 40, Intervention 86
  86: { procurement: 65000, distribution: 42000, support: 18000 },
  // Dual AI Campaign - Category 40, Intervention 87
  87: { procurement: 85000, distribution: 55000, support: 22000 },
  // Standard Pyrethroid Routine - Category 41, Intervention 88
  88: { procurement: 45000, distribution: 28000, support: 12000 },
  // PBO Routine - Category 41, Intervention 89
  89: { procurement: 55000, distribution: 35000, support: 15000 },
  // Dual AI Routine - Category 41, Intervention 90
  90: { procurement: 75000, distribution: 48000, support: 20000 },
  // R21 Vaccine - Category 42 or similar
  91: { procurement: 120000, distribution: 60000, support: 40000 },
};

export function getTotalCost(breakdown: CostBreakdown): number {
  return breakdown.procurement + breakdown.distribution + breakdown.support;
}

// Default cost for interventions not in the mock data
export const DEFAULT_COST: CostBreakdown = {
  procurement: 50000,
  distribution: 30000,
  support: 15000,
};

// Annual inflation rate (e.g., 0.05 = 5%)
export const INFLATION_RATE = 0.05;

// Budget years configuration
export const BUDGET_YEARS = {
  start: 2025,
  end: 2027,
  count: 3,
};

/**
 * Calculate the cost for a specific year with inflation applied
 * Year 1 (2025) = base cost
 * Year 2 (2026) = base cost * (1 + inflation)
 * Year 3 (2027) = base cost * (1 + inflation)^2
 */
export function getCostForYear(baseCost: number, yearIndex: number): number {
  return baseCost * Math.pow(1 + INFLATION_RATE, yearIndex);
}

/**
 * Calculate cumulative cost over a range of years (inclusive)
 * @param baseCost - The base cost (year 1)
 * @param startYearIndex - Starting year index (0-based, 0 = 2025)
 * @param endYearIndex - Ending year index (0-based, inclusive)
 */
export function getCumulativeCost(
  baseCost: number,
  startYearIndex: number,
  endYearIndex: number
): number {
  let total = 0;
  for (let i = startYearIndex; i <= endYearIndex; i++) {
    total += getCostForYear(baseCost, i);
  }
  return total;
}

/**
 * Calculate cumulative cost breakdown over a range of years
 */
export function getCumulativeCostBreakdown(
  breakdown: CostBreakdown,
  startYearIndex: number,
  endYearIndex: number
): CostBreakdown {
  return {
    procurement: getCumulativeCost(breakdown.procurement, startYearIndex, endYearIndex),
    distribution: getCumulativeCost(breakdown.distribution, startYearIndex, endYearIndex),
    support: getCumulativeCost(breakdown.support, startYearIndex, endYearIndex),
  };
}
