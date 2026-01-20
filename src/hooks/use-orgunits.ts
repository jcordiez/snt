"use client";

import { useState, useEffect, useCallback } from "react";
import type { DistrictProperties, InterventionStatus, Province, OrgUnitWithGeoJSON } from "@/data/districts";
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
    displayLabel: interventionNames.length > 0 ? interventionNames.join(" + ") : "None",
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
    displayLabel: interventionNames.length > 0 ? interventionNames.join(" + ") : "None",
  };
}

/**
 * Type for update function passed to components
 */
export type UpdateDistrictsFn = (
  districtIds: string[],
  interventionMix: InterventionMix,
  interventionCategories: InterventionCategory[]
) => void;

function transformOrgUnitsToGeoJSON(
  orgUnits: OrgUnit[]
): GeoJSON.FeatureCollection<GeoJSON.MultiPolygon | GeoJSON.Polygon, DistrictProperties> {
  const features: GeoJSON.Feature<GeoJSON.MultiPolygon | GeoJSON.Polygon, DistrictProperties>[] = [];

  for (const unit of orgUnits) {
    if (!unit.has_geo_json || !unit.geo_json?.features?.length) continue;

    const geometry = unit.geo_json.features[0]?.geometry;
    if (!geometry) continue;

    // Initialize districts without any intervention data (no mock/fake interventions)
    // Interventions are assigned by the user through the intervention wizard
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
      },
      geometry: geometry as GeoJSON.MultiPolygon | GeoJSON.Polygon,
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

export function useOrgUnits() {
  const [data, setData] = useState<GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/orgunits");
        if (!response.ok) {
          throw new Error("Failed to fetch org units data");
        }
        const orgUnits: OrgUnit[] = await response.json();
        const geoJSON = transformOrgUnitsToGeoJSON(orgUnits);
        setData(geoJSON);

        // Extract provinces from org units
        const orgUnitsWithGeoJSON: OrgUnitWithGeoJSON[] = orgUnits.map((unit) => ({
          id: unit.id,
          name: unit.name,
          parent_id: unit.parent_id,
          parent_name: unit.parent_name,
          geo_json: unit.geo_json,
        }));
        const extractedProvinces = extractProvinces(orgUnitsWithGeoJSON);
        setProvinces(extractedProvinces);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  /**
   * Updates district properties with intervention mix data.
   * This is an in-memory update that persists within the session.
   * Uses additive/merge behavior: preserves existing interventions from other categories,
   * only replaces interventions from categories being applied.
   */
  const updateDistricts: UpdateDistrictsFn = useCallback((districtIds, interventionMix, interventionCategories) => {
    setData((prevData) => {
      if (!prevData) return prevData;

      const districtIdSet = new Set(districtIds);
      const updatedFeatures = prevData.features.map((feature) => {
        if (!districtIdSet.has(feature.properties.districtId)) {
          return feature;
        }

        // Merge with existing intervention mix (additive behavior)
        const existingMix = feature.properties.interventionMix;
        const mergedMix = mergeInterventionMixes(existingMix, interventionMix, interventionCategories);

        // Update the district with the merged intervention mix
        return {
          ...feature,
          properties: {
            ...feature.properties,
            interventionMix: mergedMix,
            interventionMixLabel: mergedMix.displayLabel, // Flat property for MapLibre expressions
            interventionStatus: "ongoing" as InterventionStatus, // Mark as ongoing when interventions are applied
            interventions: [mergedMix.displayLabel], // Update legacy field
            interventionCount: mergedMix.categoryAssignments.size,
          },
        };
      });

      return {
        ...prevData,
        features: updatedFeatures,
      };
    });
  }, []);

  return { data, provinces, isLoading, error, updateDistricts };
}
