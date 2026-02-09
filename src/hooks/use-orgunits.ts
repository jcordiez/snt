"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { DistrictProperties, InterventionStatus, OrgUnitWithGeoJSON } from "@/data/districts";
import { extractProvinces } from "@/data/districts";
import type { InterventionMix, InterventionCategory, Intervention } from "@/types/intervention";

interface OrgUnit {
  id: number;
  name: string;
  short_name: string;
  parent_id: number;
  parent_name: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  has_geo_json: boolean;
  org_unit_type: string;
  org_unit_type_id: number;
  org_unit_type_depth: number;
  source_id: number;
  source_name: string;
  geo_json: GeoJSON.FeatureCollection | null;
}

/**
 * Creates an InterventionMix from category-based selections
 */
export function createInterventionMix(
  selectedInterventionsByCategory: Map<number, number>,
  interventionCategories: InterventionCategory[]
): InterventionMix {
  // Build a lookup map from intervention ID to intervention object
  const interventionLookup = new Map<number, Intervention>();
  for (const category of interventionCategories) {
    for (const intervention of category.interventions) {
      interventionLookup.set(intervention.id, intervention);
    }
  }

  // Create sorted display label (using short_name, joined with " + ")
  const sortedCategoryIds = Array.from(selectedInterventionsByCategory.keys()).sort((a, b) => a - b);
  const interventionNames: string[] = [];

  for (const categoryId of sortedCategoryIds) {
    const interventionId = selectedInterventionsByCategory.get(categoryId);
    if (interventionId !== undefined) {
      const intervention = interventionLookup.get(interventionId);
      if (intervention) {
        interventionNames.push(intervention.short_name);
      }
    }
  }

  return {
    categoryAssignments: new Map(selectedInterventionsByCategory),
    displayLabel: interventionNames.length > 0 ? interventionNames.join(" + ") : "",
  };
}

/**
 * Merges a new intervention mix with an existing one.
 * - Preserves interventions from categories not in the new mix
 * - Replaces interventions from categories that are in the new mix
 */
export function mergeInterventionMixes(
  existing: InterventionMix | undefined,
  incoming: InterventionMix,
  interventionCategories: InterventionCategory[]
): InterventionMix {
  // If no existing mix, return the incoming mix as-is
  if (!existing) {
    return incoming;
  }

  // Build intervention lookup for display label generation
  const interventionLookup = new Map<number, Intervention>();
  for (const category of interventionCategories) {
    for (const intervention of category.interventions) {
      interventionLookup.set(intervention.id, intervention);
    }
  }

  // Merge: start with existing, then apply incoming (overwriting same categories)
  const mergedAssignments = new Map<number, number>(existing.categoryAssignments);
  incoming.categoryAssignments.forEach((interventionId, categoryId) => {
    mergedAssignments.set(categoryId, interventionId);
  });

  // Generate new display label from merged assignments
  const sortedCategoryIds = Array.from(mergedAssignments.keys()).sort((a, b) => a - b);
  const interventionNames: string[] = [];

  for (const categoryId of sortedCategoryIds) {
    const interventionId = mergedAssignments.get(categoryId);
    if (interventionId !== undefined) {
      const intervention = interventionLookup.get(interventionId);
      if (intervention) {
        interventionNames.push(intervention.short_name);
      }
    }
  }

  return {
    categoryAssignments: mergedAssignments,
    displayLabel: interventionNames.length > 0 ? interventionNames.join(" + ") : "",
  };
}

/**
 * Type for update function passed to components
 */
export type UpdateDistrictsFn = (
  districtIds: string[],
  interventionMix: InterventionMix,
  interventionCategories: InterventionCategory[],
  options?: { replace?: boolean; ruleColor?: string; colorByCategory?: Record<string, string> }
) => void;

function transformOrgUnitsToGeoJSON(
  orgUnits: OrgUnit[]
): GeoJSON.FeatureCollection<GeoJSON.MultiPolygon | GeoJSON.Polygon, DistrictProperties> {
  const features: GeoJSON.Feature<GeoJSON.MultiPolygon | GeoJSON.Polygon, DistrictProperties>[] = [];

  for (const unit of orgUnits) {
    if (!unit.has_geo_json || !unit.geo_json?.features?.length) continue;

    const geometry = unit.geo_json.features[0]?.geometry;
    if (!geometry) continue;

    features.push({
      type: "Feature",
      properties: {
        districtId: String(unit.id),
        districtName: unit.name,
        regionId: String(unit.parent_id),
        regionName: unit.parent_name,
        interventionStatus: "none" as InterventionStatus,
        interventionCount: 0,
        interventions: [],
        interventionMixLabel: "",
        interventionCategoryAssignments: {},
      },
      geometry: geometry as GeoJSON.MultiPolygon | GeoJSON.Polygon,
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

async function fetchOrgUnits(): Promise<OrgUnit[]> {
  const response = await fetch("/api/orgunits");
  if (!response.ok) {
    throw new Error("Failed to fetch org units data");
  }
  return response.json();
}

export function useOrgUnits() {
  // Fetch raw org units data with React Query
  const query = useQuery({
    queryKey: queryKeys.orgUnits,
    queryFn: fetchOrgUnits,
    staleTime: Infinity, // Geographic data rarely changes
    gcTime: Infinity,    // Never garbage collect static geographic data
  });

  // Local state for GeoJSON data that can be modified by updateDistricts
  const [data, setData] = useState<GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null>(null);

  // Compute provinces from raw data (memoized)
  const provinces = useMemo(() => {
    if (!query.data) return [];
    const orgUnitsWithGeoJSON: OrgUnitWithGeoJSON[] = query.data.map((unit) => ({
      id: unit.id,
      name: unit.name,
      parent_id: unit.parent_id,
      parent_name: unit.parent_name,
      geo_json: unit.geo_json,
    }));
    return extractProvinces(orgUnitsWithGeoJSON);
  }, [query.data]);

  // Initialize GeoJSON data when query data is available
  useEffect(() => {
    if (query.data && !data) {
      const geoJSON = transformOrgUnitsToGeoJSON(query.data);
      setData(geoJSON);
    }
  }, [query.data, data]);

  /**
   * Updates district properties with intervention mix data.
   * This is an in-memory update that persists within the session.
   * By default uses additive/merge behavior: preserves existing interventions from other categories,
   * only replaces interventions from categories being applied.
   * When options.replace is true, fully replaces the intervention mix (used when editing from legend).
   * CM (Case Management) is always included as the baseline intervention.
   */
  const updateDistricts: UpdateDistrictsFn = useCallback((districtIds, interventionMix, interventionCategories, options) => {
    console.log("updateDistricts called with:", {
      districtIds,
      interventionMixLabel: interventionMix.displayLabel,
      numCategories: interventionCategories.length,
    });

    setData((prevData) => {
      if (!prevData) {
        console.log("updateDistricts: prevData is null");
        return prevData;
      }

      const districtIdSet = new Set(districtIds);
      console.log("updateDistricts: looking for district IDs:", Array.from(districtIdSet));
      console.log("updateDistricts: first few feature IDs:", prevData.features.slice(0, 3).map(f => f.properties.districtId));

      let matchCount = 0;
      const updatedFeatures = prevData.features.map((feature) => {
        if (!districtIdSet.has(feature.properties.districtId)) {
          return feature;
        }
        matchCount++;

        // Determine the final mix based on replace mode
        let finalMix: InterventionMix;
        let finalColorByCategory: Record<string, string>;

        if (options?.replace) {
          // Replace mode: use the incoming mix directly (for editing from legend)
          finalMix = interventionMix;
          finalColorByCategory = options?.colorByCategory ?? {};
        } else {
          // Merge mode: preserve existing interventions from other categories
          const existingAssignments = feature.properties.interventionCategoryAssignments
            ? new Map(Object.entries(feature.properties.interventionCategoryAssignments).map(([k, v]) => [Number(k), v as number]))
            : new Map<number, number>();

          const existingMix: InterventionMix = {
            categoryAssignments: existingAssignments,
            displayLabel: feature.properties.interventionMixLabel ?? "None",
          };
          finalMix = mergeInterventionMixes(existingMix, interventionMix, interventionCategories);

          // Merge colorByCategory: existing colors + incoming colors (incoming overwrites)
          finalColorByCategory = {
            ...(feature.properties.colorByCategory ?? {}),
            ...(options?.colorByCategory ?? {}),
          };
        }

        // Build colorByInterventionName from colorByCategory and finalMix
        const colorByInterventionName: Record<string, string> = {};
        finalMix.categoryAssignments.forEach((interventionId, categoryId) => {
          const category = interventionCategories.find((c) => c.id === categoryId);
          if (category) {
            const intervention = category.interventions.find((i) => i.id === interventionId);
            if (intervention) {
              const color = finalColorByCategory[String(categoryId)];
              if (color) {
                colorByInterventionName[intervention.short_name] = color;
              }
            }
          }
        });

        // Update the district with the final intervention mix
        // NOTE: Do NOT store interventionMix directly in properties - it contains a Map
        // which cannot be serialized by MapLibre. Only store serializable properties.
        return {
          ...feature,
          properties: {
            ...feature.properties,
            // Store category assignments as a plain object for potential future use
            // (converted from Map to Object for JSON serialization)
            interventionCategoryAssignments: Object.fromEntries(finalMix.categoryAssignments),
            interventionMixLabel: finalMix.displayLabel, // Flat property for MapLibre expressions
            interventionStatus: "ongoing" as InterventionStatus, // Mark as ongoing when interventions are applied
            interventions: [finalMix.displayLabel], // Update legacy field
            interventionCount: finalMix.categoryAssignments.size,
            // Apply rule color if provided (used for map rendering); explicitly set empty string to clear
            ...(options?.ruleColor !== undefined ? { ruleColor: options.ruleColor } : {}),
            // Store per-category colors for tooltip display
            colorByCategory: finalColorByCategory,
            // Store per-intervention-name colors for easy tooltip access
            colorByInterventionName,
          },
        };
      });

      console.log("updateDistricts: matched and updated", matchCount, "features");
      console.log("updateDistricts: sample updated labels:",
        updatedFeatures
          .filter(f => districtIdSet.has(f.properties.districtId))
          .slice(0, 3)
          .map(f => ({ id: f.properties.districtId, label: f.properties.interventionMixLabel }))
      );

      return {
        ...prevData,
        features: updatedFeatures,
      };
    });
  }, []);

  // Loading state: true while fetching OR before GeoJSON is initialized
  const isLoading = query.isLoading || (query.data !== undefined && data === null);

  return { data, provinces, isLoading, error: query.error, updateDistricts };
}
