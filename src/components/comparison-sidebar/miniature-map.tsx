"use client";

import { memo, useEffect, useRef, useMemo } from "react";
import type MapLibreGL from "maplibre-gl";
import { Map as MapComponent, useMap } from "@/components/ui/map";
import { useOrgUnits, createInterventionMix } from "@/hooks/use-orgunits";
import { useInterventionCategories } from "@/hooks/use-intervention-categories";
import { useMultipleMetricValues } from "@/hooks/use-multiple-metric-values";
import { findMatchingDistrictIds } from "@/hooks/use-district-rules";
import {
  getColorForInterventionMix,
  PREDEFINED_INTERVENTION_COLORS,
} from "@/lib/intervention-colors";
import type { DistrictProperties } from "@/data/districts";
import type { PlanDefinition } from "@/data/predefined-plans";
import type { InterventionCategory, Rule } from "@/types/intervention";

// Same metric IDs used by the main plan page
const ALL_METRIC_IDS_WITH_DATA = [404, 406, 407, 410, 412, 413];

const SOURCE_ID = "miniature-districts";
const FILL_LAYER_ID = "miniature-fills";
const BORDER_LAYER_ID = "miniature-borders";

/**
 * Computes a GeoJSON FeatureCollection with rule colors applied for a given plan.
 * This replicates the rule application logic from the plan page but produces
 * a static snapshot rather than mutating state.
 */
function applyPlanRules(
  baseDistricts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  >,
  plan: PlanDefinition,
  interventionCategories: InterventionCategory[],
  metricValuesByType: Record<number, Record<number, number>>
): GeoJSON.FeatureCollection<GeoJSON.MultiPolygon | GeoJSON.Polygon, DistrictProperties> {
  // Clone features with fresh properties
  const features = baseDistricts.features.map((f) => ({
    ...f,
    properties: { ...f.properties },
  }));

  const defaultRule = plan.rules.find((r) => r.isAllDistricts);
  const nonDefaultRules = plan.rules.filter((r) => !r.isAllDistricts);

  // Apply default rule to all districts
  if (defaultRule && defaultRule.interventionsByCategory.size > 0) {
    const mix = createInterventionMix(defaultRule.interventionsByCategory, interventionCategories);
    for (const feature of features) {
      feature.properties.interventionMixLabel = mix.displayLabel;
      feature.properties.interventionCategoryAssignments = Object.fromEntries(
        mix.categoryAssignments
      );
      feature.properties.interventionCount = mix.categoryAssignments.size;
      feature.properties.ruleColor = defaultRule.color;
    }
  }

  // Apply non-default rules in order (later rules override)
  const featureMap = new Map(features.map((f) => [f.properties.districtId, f]));

  for (const rule of nonDefaultRules) {
    const rulesForEvaluation: Rule[] = rule.criteria.map((criterion) => ({
      id: criterion.id,
      metricTypeId: criterion.metricTypeId,
      operator: criterion.operator,
      value: criterion.value,
    }));

    const matchingIds = findMatchingDistrictIds(
      baseDistricts,
      rulesForEvaluation,
      null, // no province filter for miniature maps
      metricValuesByType
    );

    // Filter out excluded districts
    const finalIds = rule.excludedDistrictIds?.length
      ? matchingIds.filter((id) => !rule.excludedDistrictIds!.includes(id))
      : matchingIds;

    if (finalIds.length > 0 && rule.interventionsByCategory.size > 0) {
      const mix = createInterventionMix(rule.interventionsByCategory, interventionCategories);
      for (const id of finalIds) {
        const feature = featureMap.get(id);
        if (feature) {
          // Merge: preserve existing categories, override with rule's categories
          const existing: Map<number, number> = feature.properties.interventionCategoryAssignments
            ? new Map(
                Object.entries(feature.properties.interventionCategoryAssignments).map(
                  ([k, v]) => [Number(k), v as number] as [number, number]
                )
              )
            : new Map();
          mix.categoryAssignments.forEach((v, k) => existing.set(k, v));

          // Rebuild display label from merged assignments
          const sortedCategoryIds = Array.from(existing.keys()).sort((a, b) => a - b);
          const names: string[] = [];
          for (const catId of sortedCategoryIds) {
            const intId = existing.get(catId);
            if (intId !== undefined) {
              for (const cat of interventionCategories) {
                const intervention = cat.interventions.find((i) => i.id === intId);
                if (intervention) {
                  names.push(intervention.short_name);
                  break;
                }
              }
            }
          }

          feature.properties.interventionMixLabel =
            names.length > 0 ? names.join(" + ") : "None";
          feature.properties.interventionCategoryAssignments = Object.fromEntries(existing);
          feature.properties.interventionCount = existing.size;
          feature.properties.ruleColor = rule.color;
        }
      }
    }
  }

  return { type: "FeatureCollection", features };
}

/**
 * Builds a MapLibre color expression from districts data.
 * Priority: ruleColor (if set) > interventionMixLabel-based color.
 */
function buildColorExpression(
  districtsData: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  >
): MapLibreGL.ExpressionSpecification | string {
  const colorMap = new Map<string, string>();
  for (const feature of districtsData.features) {
    const mixLabel = feature.properties.interventionMixLabel;
    if (mixLabel && !colorMap.has(mixLabel)) {
      colorMap.set(mixLabel, getColorForInterventionMix(mixLabel));
    }
  }

  const matchCases: string[] = [];
  colorMap.forEach((color: string, label: string) => {
    matchCases.push(label, color);
  });

  const fallbackExpression =
    matchCases.length > 0
      ? ["match", ["get", "interventionMixLabel"], ...matchCases, PREDEFINED_INTERVENTION_COLORS["CM"]]
      : PREDEFINED_INTERVENTION_COLORS["CM"];

  return [
    "case",
    ["all", ["has", "ruleColor"], ["!=", ["get", "ruleColor"], ""]],
    ["get", "ruleColor"],
    fallbackExpression,
  ] as unknown as MapLibreGL.ExpressionSpecification;
}

/**
 * Inner component that renders district layers on the miniature map.
 * Must be a child of <Map> to access the map context.
 */
function MiniatureDistrictLayer({
  districts,
}: {
  districts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  >;
}) {
  const { map, isLoaded } = useMap();
  const layersAdded = useRef(false);

  // Add source and layers on mount
  useEffect(() => {
    if (!isLoaded || !map) return;
    if (map.getSource(SOURCE_ID)) {
      layersAdded.current = true;
      return;
    }

    const colorExpression = buildColorExpression(districts);

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: districts,
    });

    map.addLayer({
      id: FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": colorExpression,
        "fill-opacity": 0.7,
      },
    });

    map.addLayer({
      id: BORDER_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#ffffff",
        "line-width": 0.5,
      },
    });

    layersAdded.current = true;
  }, [isLoaded, map, districts]);

  // Update data and colors when districts change
  useEffect(() => {
    if (!isLoaded || !map || !layersAdded.current) return;

    const source = map.getSource(SOURCE_ID) as MapLibreGL.GeoJSONSource | undefined;
    if (source) {
      source.setData(districts);
    }

    const colorExpression = buildColorExpression(districts);
    if (map.getLayer(FILL_LAYER_ID)) {
      map.setPaintProperty(FILL_LAYER_ID, "fill-color", colorExpression);
    }
  }, [isLoaded, map, districts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      try {
        if (map.getLayer(BORDER_LAYER_ID)) map.removeLayer(BORDER_LAYER_ID);
        if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        layersAdded.current = false;
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [map]);

  return null;
}

interface MiniatureMapProps {
  plan: PlanDefinition;
}

export const MiniatureMap = memo(function MiniatureMap({ plan }: MiniatureMapProps) {
  const { data: baseDistricts } = useOrgUnits();
  const { data: interventionCategories } = useInterventionCategories();
  const { metricValuesByType } = useMultipleMetricValues(ALL_METRIC_IDS_WITH_DATA);

  const metricValuesLoaded = Object.keys(metricValuesByType).length > 0;

  // Compute colored districts for this plan
  const planDistricts = useMemo(() => {
    if (!baseDistricts || !interventionCategories?.length || !metricValuesLoaded) return null;

    // Create a fresh copy of base districts with default CM properties
    const freshDistricts: GeoJSON.FeatureCollection<
      GeoJSON.MultiPolygon | GeoJSON.Polygon,
      DistrictProperties
    > = {
      type: "FeatureCollection",
      features: baseDistricts.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          interventionMixLabel: "CM",
          ruleColor: undefined as unknown as string,
          interventionCategoryAssignments: undefined,
          interventionCount: 1,
        },
      })),
    };

    return applyPlanRules(freshDistricts, plan, interventionCategories, metricValuesByType);
  }, [baseDistricts, interventionCategories, metricValuesLoaded, metricValuesByType, plan]);

  if (!planDistricts) {
    return (
      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="aspect-[4/3]">
      <MapComponent
        center={[23.6, -2.9]}
        zoom={4}
        interactive={false}
        attributionControl={false}
      >
        <MiniatureDistrictLayer districts={planDistricts} />
      </MapComponent>
    </div>
  );
});
