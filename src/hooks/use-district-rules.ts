"use client";

import { useMemo } from "react";
import type { Rule, RuleOperator } from "@/types/intervention";
import type { DistrictProperties } from "@/data/districts";

interface DistrictMetricValues {
  [districtId: string]: {
    [metricTypeId: number]: number;
  };
}

/**
 * Generates deterministic mock metric values for a district based on district ID.
 * Uses a simple hash-based approach to ensure consistent values per district.
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

  // Normalize to a value between 0 and 100
  return Math.abs(hash % 101);
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
}

export function useDistrictRules({ districts, rules }: UseDistrictRulesParams) {
  // Generate mock metric values for all districts
  const metricValues = useMemo<DistrictMetricValues>(() => {
    if (!districts) return {};

    const values: DistrictMetricValues = {};

    for (const feature of districts.features) {
      const districtId = feature.properties.districtId;
      values[districtId] = {};

      // Generate values for metric IDs 1-20 (covering all possible metrics)
      for (let metricId = 1; metricId <= 20; metricId++) {
        values[districtId][metricId] = generateMockMetricValue(districtId, metricId);
      }
    }

    return values;
  }, [districts]);

  // Find districts matching all rules (AND logic)
  const matchingDistricts = useMemo<DistrictWithProperties[]>(() => {
    if (!districts) return [];

    const completeRules = rules.filter(isRuleComplete);

    // If no complete rules, return empty array
    if (completeRules.length === 0) return [];

    const matches: DistrictWithProperties[] = [];

    for (const feature of districts.features) {
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
  }, [districts, rules, metricValues]);

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
