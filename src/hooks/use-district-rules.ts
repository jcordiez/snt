"use client";

import { useMemo } from "react";
import type { Rule, RuleOperator } from "@/types/intervention";
import type { DistrictProperties } from "@/data/districts";

interface DistrictMetricValues {
  [districtId: string]: {
    [metricTypeId: number]: number;
  };
}

// Metric type IDs from the API (325-340)
const METRIC_TYPE_IDS = [325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340];

// Metric type configurations with realistic min/max ranges
// Based on legend_config.domain values from metric-types API
const METRIC_CONFIGS: Record<number, { min: number; max: number }> = {
  325: { min: 50000, max: 600000 },   // Population totale
  326: { min: 0, max: 100 },          // Population rurale (%)
  327: { min: 0, max: 600000 },       // Population déplacée
  328: { min: 0, max: 250 },          // Mortalité infanto-juvénile
  329: { min: 0, max: 100 },          // Non-recours aux services curatifs (%)
  330: { min: 0, max: 100 },          // Inaccessibilité aux soins (%)
  331: { min: 50, max: 1200 },        // Incidence brute (DHIS2)
  332: { min: 50, max: 1200 },        // Incidence ajustée pour le dépistage
  333: { min: 50, max: 1200 },        // Incidence ajustée pour le taux de rapportage
  334: { min: 50, max: 1200 },        // Incidence ajustée pour la recherche de soins
  335: { min: 0, max: 100 },          // Prévalence du paludisme (%)
  336: { min: 0, max: 100 },          // Résistance aux insecticides (%)
  337: { min: 0, max: 100 },          // Saisonnalité (%)
  338: { min: 200, max: 2000 },       // Déficit de PIB par habitant (USD)
  339: { min: 0, max: 1500 },         // Insécurité (nombre de conflits)
  340: { min: 0, max: 100 },          // Utilisation des MILDA (%)
};

/**
 * Generates deterministic mock metric values for a district based on district ID.
 * Uses a simple hash-based approach to ensure consistent values per district.
 * Values are scaled to realistic ranges based on metric type.
 */
function generateMockMetricValue(districtId: string, metricTypeId: number): number {
  // Create a simple hash from districtId and metricTypeId
  let hash = 0;
  const seed = `${districtId}-${metricTypeId}`;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Get the config for this metric type, default to 0-100 if not found
  const config = METRIC_CONFIGS[metricTypeId] || { min: 0, max: 100 };

  // Normalize hash to 0-1 range, then scale to metric's min/max
  const normalizedValue = Math.abs(hash % 10001) / 10000; // 0-1 with more precision
  const scaledValue = config.min + normalizedValue * (config.max - config.min);

  // Round to reasonable precision
  return Math.round(scaledValue * 100) / 100;
}

/**
 * Evaluates a single rule against a metric value
 */
function evaluateRule(value: number, operator: RuleOperator, threshold: number): boolean {
  switch (operator) {
    case "<":
      return value < threshold;
    case "<=":
      return value <= threshold;
    case "=":
      return value === threshold;
    case ">=":
      return value >= threshold;
    case ">":
      return value > threshold;
    default:
      return false;
  }
}

/**
 * Checks if a rule is complete (has all required values)
 */
function isRuleComplete(rule: Rule): boolean {
  return rule.metricTypeId !== null && rule.value !== "" && !isNaN(Number(rule.value));
}

export interface DistrictWithProperties {
  districtId: string;
  districtName: string;
  regionName: string;
}

interface UseDistrictRulesParams {
  districts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null;
  rules: Rule[];
  selectedProvinceId?: string | null;
}

export function useDistrictRules({ districts, rules, selectedProvinceId }: UseDistrictRulesParams) {
  // Filter districts by province if a province is selected
  const filteredDistricts = useMemo(() => {
    if (!districts) return null;
    if (!selectedProvinceId) return districts;

    return {
      ...districts,
      features: districts.features.filter(
        (feature) => feature.properties.regionId === selectedProvinceId
      ),
    };
  }, [districts, selectedProvinceId]);

  // Generate mock metric values for all districts (use full set for consistent values)
  const metricValues = useMemo<DistrictMetricValues>(() => {
    if (!districts) return {};

    const values: DistrictMetricValues = {};

    for (const feature of districts.features) {
      const districtId = feature.properties.districtId;
      values[districtId] = {};

      // Generate values for actual metric type IDs (325-340)
      for (const metricId of METRIC_TYPE_IDS) {
        values[districtId][metricId] = generateMockMetricValue(districtId, metricId);
      }
    }

    return values;
  }, [districts]);

  // Find districts matching all rules (AND logic) - only within filtered districts
  const matchingDistricts = useMemo<DistrictWithProperties[]>(() => {
    if (!filteredDistricts) return [];

    const completeRules = rules.filter(isRuleComplete);

    // If no complete rules, return empty array
    if (completeRules.length === 0) return [];

    const matches: DistrictWithProperties[] = [];

    for (const feature of filteredDistricts.features) {
      const districtId = feature.properties.districtId;
      const districtMetrics = metricValues[districtId];

      if (!districtMetrics) continue;

      // Check if all rules match (AND logic)
      const allRulesMatch = completeRules.every((rule) => {
        const metricValue = districtMetrics[rule.metricTypeId!];
        const threshold = Number(rule.value);
        return evaluateRule(metricValue, rule.operator, threshold);
      });

      if (allRulesMatch) {
        matches.push({
          districtId: feature.properties.districtId,
          districtName: feature.properties.districtName,
          regionName: feature.properties.regionName,
        });
      }
    }

    return matches;
  }, [filteredDistricts, rules, metricValues]);

  // Get metric value for a specific district and metric
  const getMetricValue = (districtId: string, metricTypeId: number): number | undefined => {
    return metricValues[districtId]?.[metricTypeId];
  };

  // Check if at least one rule is complete
  const hasCompleteRules = rules.some(isRuleComplete);

  return {
    matchingDistricts,
    matchingCount: matchingDistricts.length,
    metricValues,
    getMetricValue,
    hasCompleteRules,
  };
}
