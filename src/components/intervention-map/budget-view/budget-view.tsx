"use client";

import { useMemo } from "react";
import type { MultiPolygon, Polygon } from "geojson";
import type { DistrictProperties, Province } from "@/data/districts";
import type { InterventionCategory, Intervention } from "@/types/intervention";
import { CostSummary } from "./cost-summary";
import { CategoryPieChart } from "./category-pie-chart";
import { InterventionBarChart } from "./intervention-bar-chart";
import {
  INTERVENTION_COSTS,
  DEFAULT_COST,
  getTotalCost,
  type CostBreakdown,
} from "./cost-data";

interface BudgetViewProps {
  districts: GeoJSON.FeatureCollection<
    MultiPolygon | Polygon,
    DistrictProperties
  > | null;
  selectedProvince: Province | null;
  interventionCategories: InterventionCategory[];
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

  // Calculate costs per intervention
  const interventionCosts = useMemo(() => {
    const costMap = new Map<number, InterventionCostData>();

    for (const district of filteredDistricts) {
      const assignments = district.interventionCategoryAssignments || {};

      for (const [, interventionId] of Object.entries(assignments)) {
        const id = interventionId as number;
        const info = interventionLookup.get(id);
        if (!info) continue;

        const costs: CostBreakdown = INTERVENTION_COSTS[id] || DEFAULT_COST;
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
  }, [filteredDistricts, interventionLookup]);

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
    <div className="flex flex-col h-full overflow-auto p-6 gap-6">
      {/* Total Cost Summary */}
      <CostSummary totalCost={totalCost} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        {/* Pie Chart - Left */}
        <div className="bg-card border rounded-lg p-4 min-h-[350px]">
          <CategoryPieChart categoryCosts={categoryCosts} />
        </div>

        {/* Bar Chart - Right */}
        <div className="bg-card border rounded-lg p-4 min-h-[350px]">
          <InterventionBarChart interventionCosts={interventionCosts} />
        </div>
      </div>
    </div>
  );
}
