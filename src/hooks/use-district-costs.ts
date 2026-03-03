import { useMemo } from "react";
import type { DistrictProperties } from "@/data/districts";
import {
  INTERVENTION_COSTS,
  DEFAULT_COST,
  getTotalCost,
  getCumulativeCostBreakdown,
} from "@/components/intervention-map/budget-view/cost-data";

export interface DistrictCost {
  districtId: string;
  districtName: string;
  totalCost: number;
}

export interface DistrictCostsResult {
  /** Map of districtId -> total cost */
  costByDistrictId: Map<string, number>;
  /** Array of all district costs (for statistics) */
  districtCosts: DistrictCost[];
  /** Min cost across all districts */
  minCost: number;
  /** Max cost across all districts */
  maxCost: number;
}

export function useDistrictCosts(
  districts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null,
  selectedProvinceId?: string | null,
  startYearIndex: number = 0,
  endYearIndex: number = 0
): DistrictCostsResult {
  return useMemo(() => {
    const costByDistrictId = new Map<string, number>();
    const districtCosts: DistrictCost[] = [];
    let minCost = Infinity;
    let maxCost = 0;

    if (!districts?.features) {
      return { costByDistrictId, districtCosts, minCost: 0, maxCost: 0 };
    }

    for (const feature of districts.features) {
      const props = feature.properties;

      // Filter by province if selected
      if (selectedProvinceId && props.regionId !== selectedProvinceId) {
        continue;
      }

      const assignments = props.interventionCategoryAssignments || {};
      let totalCost = 0;

      for (const interventionId of Object.values(assignments)) {
        const baseCosts =
          INTERVENTION_COSTS[interventionId as number] || DEFAULT_COST;
        // Calculate cumulative cost over the selected year range with inflation
        const cumulativeCosts = getCumulativeCostBreakdown(
          baseCosts,
          startYearIndex,
          endYearIndex
        );
        totalCost += getTotalCost(cumulativeCosts);
      }

      costByDistrictId.set(props.districtId, totalCost);
      districtCosts.push({
        districtId: props.districtId,
        districtName: props.districtName,
        totalCost,
      });

      if (totalCost > 0) {
        minCost = Math.min(minCost, totalCost);
        maxCost = Math.max(maxCost, totalCost);
      }
    }

    // Handle edge case where no costs are found
    if (minCost === Infinity) minCost = 0;

    return { costByDistrictId, districtCosts, minCost, maxCost };
  }, [districts, selectedProvinceId, startYearIndex, endYearIndex]);
}
