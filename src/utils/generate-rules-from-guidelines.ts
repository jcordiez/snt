/**
 * Generate Rules from Guidelines
 *
 * Converts intervention guidelines into SavedRules, one rule per intervention.
 * No aggregation logic — cumulative mode handles stacking of interventions.
 */

import type { SavedRule, RuleCriterion } from "@/types/rule";
import type { InterventionGuideline } from "@/data/intervention-guidelines";
import { GUIDELINE_VARIATIONS } from "@/data/intervention-guidelines-variations";

// Category IDs (from predefined-plans.ts)
const CATEGORY_CM = 37;
const CATEGORY_IPTP = 38;
const CATEGORY_CHEMOPREVENTION = 39;
const CATEGORY_NETS_CAMPAIGN = 40;
const CATEGORY_NETS_ROUTINE = 41;
const CATEGORY_VACCINATION = 42;

// Intervention IDs (from predefined-plans.ts)
const INTERVENTION_CM = 78;
const INTERVENTION_IPTP = 80;
const INTERVENTION_SMC = 82;
const INTERVENTION_PMC = 81;
const INTERVENTION_STANDARD_PYRETHROID_CAMPAIGN = 85;
const INTERVENTION_PBO_CAMPAIGN = 84;
const INTERVENTION_STANDARD_PYRETHROID_ROUTINE = 88;
const INTERVENTION_PBO_ROUTINE = 87;
const INTERVENTION_R21 = 89;

/**
 * Mapping from guideline ID to the single intervention it represents.
 * Each entry is [categoryId, interventionId].
 */
const GUIDELINE_INTERVENTION_MAP: Record<string, [number, number]> = {
  "itns-llins": [CATEGORY_NETS_CAMPAIGN, INTERVENTION_PBO_CAMPAIGN],
  "smc": [CATEGORY_CHEMOPREVENTION, INTERVENTION_SMC],
  "pmc": [CATEGORY_CHEMOPREVENTION, INTERVENTION_PMC],
  "iptp": [CATEGORY_IPTP, INTERVENTION_IPTP],
  "rtss": [CATEGORY_VACCINATION, INTERVENTION_R21],
};

// Rule colors by guideline ID
const RULE_COLORS: Record<string, string> = {
  default: "#B0BEC5",     // Gray
  "itns-llins": "#FFB74D", // Vibrant orange
  "rtss": "#FFD54F",       // Vibrant amber
  "smc": "#81C784",        // Vibrant green
  "pmc": "#B39DDB",        // Vibrant purple
  "iptp": "#4DD0E1",       // Vibrant cyan
};

/**
 * Convert guideline criterion operator to rule criterion operator
 */
function normalizeOperator(operator: string): string {
  if (operator === "≥") return ">=";
  return operator;
}

/**
 * Convert guideline criteria to rule criteria
 */
function convertCriteria(guideline: InterventionGuideline): RuleCriterion[] {
  return guideline.criteria.map((criterion) => ({
    id: criterion.id,
    metricTypeId: criterion.metricTypeId,
    operator: normalizeOperator(criterion.operator) as RuleCriterion["operator"],
    value: criterion.threshold,
  }));
}

/**
 * Generate SavedRules from intervention guidelines — one rule per intervention.
 * Cumulative mode handles the stacking/aggregation at render time.
 *
 * @param variationId - Optional variation ID to use specific guideline set.
 *                      Defaults to "conservative" (standard WHO guidelines)
 */
export function generateRulesFromGuidelines(variationId?: string): SavedRule[] {
  const rules: SavedRule[] = [];

  const variation = variationId
    ? GUIDELINE_VARIATIONS.find(v => v.id === variationId) ?? GUIDELINE_VARIATIONS[0]
    : GUIDELINE_VARIATIONS[0];

  // Default rule: Standard pyrethroid nets + CM for all districts
  rules.push({
    id: "generated-default",
    title: "Default - Standard Prevention",
    color: RULE_COLORS.default,
    criteria: [],
    interventionsByCategory: new Map([
      [CATEGORY_NETS_CAMPAIGN, INTERVENTION_STANDARD_PYRETHROID_CAMPAIGN],
      [CATEGORY_NETS_ROUTINE, INTERVENTION_STANDARD_PYRETHROID_ROUTINE],
      [CATEGORY_CM, INTERVENTION_CM],
    ]),
    isAllDistricts: true,
  });

  // One rule per guideline, each carrying only its own intervention
  for (const guideline of variation.guidelines) {
    const mapping = GUIDELINE_INTERVENTION_MAP[guideline.id];
    if (!mapping) continue;

    const [categoryId, interventionId] = mapping;

    // For ITNs, also include routine nets
    const interventions = new Map<number, number>([[categoryId, interventionId]]);
    if (guideline.id === "itns-llins") {
      interventions.set(CATEGORY_NETS_ROUTINE, INTERVENTION_PBO_ROUTINE);
    }

    rules.push({
      id: `generated-${guideline.id}`,
      title: guideline.name,
      color: RULE_COLORS[guideline.id] ?? "#9ca3af",
      criteria: convertCriteria(guideline),
      interventionsByCategory: interventions,
    });
  }

  return rules;
}
