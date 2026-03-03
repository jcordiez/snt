"use client";

import { useMemo } from "react";
import type { MultiPolygon, Polygon } from "geojson";
import type { DistrictProperties, Province } from "@/data/districts";
import type { InterventionCategory, Intervention } from "@/types/intervention";
import { CostSummary } from "./cost-summary";
import { CategoryPieChart } from "./category-pie-chart";
import { BudgetMap } from "./budget-map";
import { useDistrictCosts } from "@/hooks/use-district-costs";
import {
  INTERVENTION_COSTS,
  DEFAULT_COST,
  getTotalCost,
  getCumulativeCostBreakdown,
  type CostBreakdown,
} from "./cost-data";

interface BudgetViewProps {
  districts: GeoJSON.FeatureCollection<
    MultiPolygon | Polygon,
    DistrictProperties
  > | null;
  selectedProvince: Province | null;
  interventionCategories: InterventionCategory[];
  /** Start year index (0-based, 0 = first budget year) */
  startYearIndex: number;
  /** End year index (0-based, inclusive) */
  endYearIndex: number;
}

interface InterventionCostData {
  interventionId: number;
  interventionName: string;
  shortName: string;
  categoryId: number;
  categoryName: string;
  procurement: number;
  distribution: number;
  support: number;
  totalCost: number;
  districtCount: number;
}

interface CategoryCostData {
  categoryId: number;
  categoryName: string;
  totalCost: number;
}

export function BudgetView({
  districts,
  selectedProvince,
  interventionCategories,
  startYearIndex,
  endYearIndex,
}: BudgetViewProps) {
  // Build intervention lookup maps
  const interventionLookup = useMemo(() => {
    const lookup = new Map<
      number,
      { intervention: Intervention; category: InterventionCategory }
    >();
    for (const category of interventionCategories) {
      for (const intervention of category.interventions) {
        lookup.set(intervention.id, { intervention, category });
      }
    }
    return lookup;
  }, [interventionCategories]);

  // Filter districts by selected province
  const filteredDistricts = useMemo(() => {
    if (!districts?.features) return [];

    return districts.features
      .filter((feature) =>
        selectedProvince
          ? feature.properties.regionId === selectedProvince.id
          : true
      )
      .map((feature) => feature.properties);
  }, [districts, selectedProvince]);

  // Calculate costs per intervention (with cumulative year range and inflation)
  const interventionCosts = useMemo(() => {
    const costMap = new Map<number, InterventionCostData>();

    for (const district of filteredDistricts) {
      const assignments = district.interventionCategoryAssignments || {};

      for (const [, interventionId] of Object.entries(assignments)) {
        const id = interventionId as number;
        const info = interventionLookup.get(id);
        if (!info) continue;

        const baseCosts: CostBreakdown = INTERVENTION_COSTS[id] || DEFAULT_COST;
        // Calculate cumulative costs over selected year range with inflation
        const costs = getCumulativeCostBreakdown(
          baseCosts,
          startYearIndex,
          endYearIndex
        );
        const totalCost = getTotalCost(costs);

        if (costMap.has(id)) {
          const existing = costMap.get(id)!;
          existing.procurement += costs.procurement;
          existing.distribution += costs.distribution;
          existing.support += costs.support;
          existing.totalCost += totalCost;
          existing.districtCount += 1;
        } else {
          costMap.set(id, {
            interventionId: id,
            interventionName: info.intervention.name,
            shortName: info.intervention.short_name,
            categoryId: info.category.id,
            categoryName: info.category.name,
            procurement: costs.procurement,
            distribution: costs.distribution,
            support: costs.support,
            totalCost,
            districtCount: 1,
          });
        }
      }
    }

    return Array.from(costMap.values());
  }, [filteredDistricts, interventionLookup, startYearIndex, endYearIndex]);

  // Aggregate costs by category
  const categoryCosts = useMemo(() => {
    const categoryMap = new Map<number, CategoryCostData>();

    for (const intCost of interventionCosts) {
      if (categoryMap.has(intCost.categoryId)) {
        const existing = categoryMap.get(intCost.categoryId)!;
        existing.totalCost += intCost.totalCost;
      } else {
        categoryMap.set(intCost.categoryId, {
          categoryId: intCost.categoryId,
          categoryName: intCost.categoryName,
          totalCost: intCost.totalCost,
        });
      }
    }

    return Array.from(categoryMap.values());
  }, [interventionCosts]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    return interventionCosts.reduce((sum, i) => sum + i.totalCost, 0);
  }, [interventionCosts]);

  // Get per-district costs for the map (with year range)
  const { costByDistrictId, minCost, maxCost } = useDistrictCosts(
    districts,
    selectedProvince?.id,
    startYearIndex,
    endYearIndex
  );

  if (!districts?.features.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading districts...
      </div>
    );
  }

  if (filteredDistricts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No districts found for selected province
      </div>
    );
  }

  return (
    <div className="h-full grid grid-cols-3 gap-4 p-4">
      {/* Left Column (1/3 width) */}
      <div className="col-span-1 flex flex-col gap-4">
        {/* Top Row (1/3 height) - Total Cost */}
        <div className="h-1/3 rounded-lg border bg-card p-4 flex items-center justify-center">
          <CostSummary totalCost={totalCost} />
        </div>

        {/* Bottom Row (2/3 height) - Pie Chart with Legend */}
        <div className="flex-1 min-h-0 rounded-lg border bg-card p-4">
          <CategoryPieChart categoryCosts={categoryCosts} />
        </div>
      </div>

      {/* Right Column (2/3 width) - Map */}
      <div className="col-span-2">
        <BudgetMap
          districts={districts}
          selectedProvince={selectedProvince}
          costByDistrictId={costByDistrictId}
          minCost={minCost}
          maxCost={maxCost}
        />
      </div>
    </div>
  );
}
