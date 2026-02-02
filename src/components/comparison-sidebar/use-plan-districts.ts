"use client";

import { useMemo } from "react";
import { useOrgUnits, createInterventionMix } from "@/hooks/use-orgunits";
import { useInterventionCategories } from "@/hooks/use-intervention-categories";
import { useMultipleMetricValues } from "@/hooks/use-multiple-metric-values";
import { findMatchingDistrictIds } from "@/hooks/use-district-rules";
import type { DistrictProperties } from "@/data/districts";
import type { PlanDefinition } from "@/data/predefined-plans";
import type { InterventionCategory, Rule } from "@/types/intervention";

const ALL_METRIC_IDS_WITH_DATA = [404, 406, 407, 410, 411, 412, 413, 417, 418, 419, 420];

/**
 * Computes a GeoJSON FeatureCollection with rule colors applied for a given plan.
 */
export function applyPlanRules(
  baseDistricts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  >,
  plan: PlanDefinition,
  interventionCategories: InterventionCategory[],
  metricValuesByType: Record<number, Record<number, number>>
): GeoJSON.FeatureCollection<GeoJSON.MultiPolygon | GeoJSON.Polygon, DistrictProperties> {
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
      null,
      metricValuesByType
    );

    const finalIds = rule.excludedDistrictIds?.length
      ? matchingIds.filter((id) => !rule.excludedDistrictIds!.includes(id))
      : matchingIds;

    if (finalIds.length > 0 && rule.interventionsByCategory.size > 0) {
      const mix = createInterventionMix(rule.interventionsByCategory, interventionCategories);
      for (const id of finalIds) {
        const feature = featureMap.get(id);
        if (feature) {
          const existing: Map<number, number> = feature.properties.interventionCategoryAssignments
            ? new Map(
                Object.entries(feature.properties.interventionCategoryAssignments).map(
                  ([k, v]) => [Number(k), v as number] as [number, number]
                )
              )
            : new Map();
          mix.categoryAssignments.forEach((v, k) => existing.set(k, v));

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
 * Hook that computes districts with applied plan rules.
 */
export function usePlanDistricts(plan: PlanDefinition) {
  const { data: baseDistricts } = useOrgUnits();
  const { data: interventionCategories } = useInterventionCategories();
  const { metricValuesByType } = useMultipleMetricValues(ALL_METRIC_IDS_WITH_DATA);

  const metricValuesLoaded = Object.keys(metricValuesByType).length > 0;

  const planDistricts = useMemo(() => {
    if (!baseDistricts || !interventionCategories?.length || !metricValuesLoaded) return null;

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
          interventionCount: 1,
          // Preserve base interventionCategoryAssignments - will be overwritten by applyPlanRules
        },
      })),
    };

    return applyPlanRules(freshDistricts, plan, interventionCategories, metricValuesByType);
  }, [baseDistricts, interventionCategories, metricValuesLoaded, metricValuesByType, plan]);

  return { planDistricts, interventionCategories };
}
