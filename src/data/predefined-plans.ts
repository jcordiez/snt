import type { SavedRule } from "@/types/rule";

/**
 * Intervention IDs by Category:
 * - CM (Case Management) - Category 37, Intervention 78
 * - IPTp - Category 38, Intervention 79
 * - SMC - Category 38, Intervention 80
 * - PMC - Category 38, Intervention 81
 * - Dual AI LLIN - Category 39, Intervention 82
 * - PBO LLIN - Category 39, Intervention 83
 * - IG2 IRS - Category 39, Intervention 84
 * - Standard Pyrethroid Campaign - Category 40, Intervention 85
 * - PBO Campaign - Category 40, Intervention 86
 * - Dual AI Campaign - Category 40, Intervention 87
 * - Standard Pyrethroid Routine - Category 41, Intervention 88
 * - PBO Routine - Category 41, Intervention 89
 * - Dual AI Routine - Category 41, Intervention 90
 *
 * Metric Type IDs:
 * - Seasonality: 413
 * - Mortality rate: 407
 * - Incidence rate: 410
 * - Insecticide resistance: 412
 */

// Category IDs
const CATEGORY_CM = 37;
const CATEGORY_CHEMOPREVENTION = 38;
// const CATEGORY_VECTOR_CONTROL = 39; // Reserved for IRS interventions
const CATEGORY_NETS_CAMPAIGN = 40;
const CATEGORY_NETS_ROUTINE = 41;

// Intervention IDs
const INTERVENTION_CM = 78;
const INTERVENTION_SMC = 80;
const INTERVENTION_PMC = 81;
const INTERVENTION_STANDARD_PYRETHROID_CAMPAIGN = 85;
const INTERVENTION_DUAL_AI_CAMPAIGN = 87;
const INTERVENTION_STANDARD_PYRETHROID_ROUTINE = 88;
const INTERVENTION_DUAL_AI_ROUTINE = 90;

// Metric Type IDs
const METRIC_SEASONALITY = 413;
const METRIC_MORTALITY_RATE = 407;
const METRIC_INCIDENCE_RATE = 410;
const METRIC_INSECTICIDE_RESISTANCE = 412;

// Rule colors
const RULE_COLORS = [
  "#22c55e", // green-500
  "#3b82f6", // blue-500
  "#f97316", // orange-500
  "#a855f7", // purple-500
  "#9ca3af", // gray-400 (default rule)
];

export interface PlanDefinition {
  id: string;
  name: string;
  description?: string;
  rules: SavedRule[];
}

/**
 * NSP 2026-30 Plan (National Strategic Plan)
 * Contains 4 rules: 3 criteria-based + 1 default
 */
const NSP_2026_30_PLAN: PlanDefinition = {
  id: "nsp-2026-30",
  name: "NSP 2026-30",
  description: "National Strategic Plan 2026-2030",
  rules: [
    // Rule 1: High Seasonality, High Mortality
    {
      id: "nsp-rule-1",
      title: "High Seasonality, High Mortality",
      color: RULE_COLORS[0],
      criteria: [
        {
          id: "nsp-r1-c1",
          metricTypeId: METRIC_SEASONALITY,
          operator: ">=",
          value: "0.6",
        },
        {
          id: "nsp-r1-c2",
          metricTypeId: METRIC_MORTALITY_RATE,
          operator: ">=",
          value: "5",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_DUAL_AI_CAMPAIGN], // Dual AI Nets (Campaign)
        [CATEGORY_NETS_ROUTINE, INTERVENTION_DUAL_AI_ROUTINE], // Dual AI Nets (Routine)
        [CATEGORY_CHEMOPREVENTION, INTERVENTION_SMC], // SMC
        // R21 (Vaccine) - not available in current intervention categories
        [CATEGORY_CM, INTERVENTION_CM], // CM
      ]),
      isAllDistricts: false,
    },
    // Rule 2: Low Seasonality, High Incidence, High Mortality, High Resistance
    {
      id: "nsp-rule-2",
      title: "Low Seasonality, High Incidence, High Mortality, High Resistance",
      color: RULE_COLORS[1],
      criteria: [
        {
          id: "nsp-r2-c1",
          metricTypeId: METRIC_SEASONALITY,
          operator: "<",
          value: "0.6",
        },
        {
          id: "nsp-r2-c2",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">=",
          value: "300",
        },
        {
          id: "nsp-r2-c3",
          metricTypeId: METRIC_MORTALITY_RATE,
          operator: ">=",
          value: "5",
        },
        {
          id: "nsp-r2-c4",
          metricTypeId: METRIC_INSECTICIDE_RESISTANCE,
          operator: ">=",
          value: "0.75",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_DUAL_AI_CAMPAIGN], // Dual AI Nets (Campaign)
        [CATEGORY_NETS_ROUTINE, INTERVENTION_DUAL_AI_ROUTINE], // Dual AI Nets (Routine)
        [CATEGORY_CHEMOPREVENTION, INTERVENTION_PMC], // PMC
        // R21 (Vaccine) - not available in current intervention categories
        [CATEGORY_CM, INTERVENTION_CM], // CM
      ]),
      isAllDistricts: false,
    },
    // Rule 3: Low Seasonality, High Incidence, Low Mortality, High Resistance
    {
      id: "nsp-rule-3",
      title: "Low Seasonality, High Incidence, Low Mortality, High Resistance",
      color: RULE_COLORS[2],
      criteria: [
        {
          id: "nsp-r3-c1",
          metricTypeId: METRIC_SEASONALITY,
          operator: "<",
          value: "0.6",
        },
        {
          id: "nsp-r3-c2",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">=",
          value: "300",
        },
        {
          id: "nsp-r3-c3",
          metricTypeId: METRIC_MORTALITY_RATE,
          operator: "<",
          value: "5",
        },
        {
          id: "nsp-r3-c4",
          metricTypeId: METRIC_INSECTICIDE_RESISTANCE,
          operator: ">=",
          value: "0.75",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_DUAL_AI_CAMPAIGN], // Dual AI Nets (Campaign)
        [CATEGORY_NETS_ROUTINE, INTERVENTION_DUAL_AI_ROUTINE], // Dual AI Nets (Routine)
        [CATEGORY_CHEMOPREVENTION, INTERVENTION_PMC], // PMC
        [CATEGORY_CM, INTERVENTION_CM], // CM
      ]),
      isAllDistricts: false,
    },
    // Default Rule: All Remaining Districts
    {
      id: "nsp-default",
      title: "Default",
      color: RULE_COLORS[4],
      criteria: [],
      interventionsByCategory: new Map([
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_STANDARD_PYRETHROID_CAMPAIGN], // Standard Pyrethroid Nets (Campaign)
        [CATEGORY_NETS_ROUTINE, INTERVENTION_STANDARD_PYRETHROID_ROUTINE], // Standard Pyrethroid Nets (Routine)
        [CATEGORY_CM, INTERVENTION_CM], // CM
      ]),
      isAllDistricts: true,
    },
  ],
};

/**
 * BAU Plan (Business As Usual)
 * Contains 2 rules: 1 criteria-based + 1 default
 */
const BAU_PLAN: PlanDefinition = {
  id: "bau",
  name: "BAU",
  description: "Business As Usual baseline plan",
  rules: [
    // Rule 1: Low Seasonality, High Incidence, Low Mortality, High Resistance
    {
      id: "bau-rule-1",
      title: "Low Seasonality, High Incidence, Low Mortality, High Resistance",
      color: RULE_COLORS[0],
      criteria: [
        {
          id: "bau-r1-c1",
          metricTypeId: METRIC_SEASONALITY,
          operator: "<",
          value: "0.7",
        },
        {
          id: "bau-r1-c2",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">=",
          value: "500",
        },
        {
          id: "bau-r1-c3",
          metricTypeId: METRIC_MORTALITY_RATE,
          operator: "<",
          value: "10",
        },
        {
          id: "bau-r1-c4",
          metricTypeId: METRIC_INSECTICIDE_RESISTANCE,
          operator: ">=",
          value: "0.75",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_DUAL_AI_CAMPAIGN], // Dual AI Nets (Campaign)
        [CATEGORY_NETS_ROUTINE, INTERVENTION_DUAL_AI_ROUTINE], // Dual AI Nets (Routine)
        [CATEGORY_CHEMOPREVENTION, INTERVENTION_PMC], // PMC
        [CATEGORY_CM, INTERVENTION_CM], // CM
      ]),
      isAllDistricts: false,
    },
    // Default Rule: All Remaining Districts
    {
      id: "bau-default",
      title: "Default",
      color: RULE_COLORS[4],
      criteria: [],
      interventionsByCategory: new Map([
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_STANDARD_PYRETHROID_CAMPAIGN], // Standard Pyrethroid Nets (Campaign)
        [CATEGORY_NETS_ROUTINE, INTERVENTION_STANDARD_PYRETHROID_ROUTINE], // Standard Pyrethroid Nets (Routine)
        [CATEGORY_CM, INTERVENTION_CM], // CM
      ]),
      isAllDistricts: true,
    },
  ],
};

/**
 * All predefined plans
 */
export const PREDEFINED_PLANS: PlanDefinition[] = [BAU_PLAN, NSP_2026_30_PLAN];

/**
 * Get a plan by its ID
 */
export function getPlanById(planId: string): PlanDefinition | undefined {
  return PREDEFINED_PLANS.find((plan) => plan.id === planId);
}

/**
 * Get default rules for a new plan
 * Returns a single default rule with CM + Standard Pyrethroid interventions
 */
export function getDefaultRulesForNewPlan(): SavedRule[] {
  return [
    {
      id: "default-rule",
      title: "Default",
      color: RULE_COLORS[4],
      criteria: [],
      interventionsByCategory: new Map([
        [CATEGORY_CM, INTERVENTION_CM],
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_STANDARD_PYRETHROID_CAMPAIGN],
        [CATEGORY_NETS_ROUTINE, INTERVENTION_STANDARD_PYRETHROID_ROUTINE],
      ]),
      isAllDistricts: true,
    },
  ];
}
