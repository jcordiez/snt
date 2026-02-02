import type { SavedRule } from "@/types/rule";

/**
 * Intervention IDs by Category (from api/snt-malaria/intervention_categories/data.json):
 * - Category 37 (Case Management): 78 = CM, 79 = CM Subsidy
 * - Category 38 (IPTp): 80 = IPTp (SP)
 * - Category 39 (PMC & SMC): 81 = PMC, 82 = SMC
 * - Category 40 (ITN Campaign): 83 = Dual AI, 84 = PBO, 85 = Standard Pyrethroid
 * - Category 41 (ITN Routine): 86 = Dual AI, 87 = PBO, 88 = Standard Pyrethroid
 * - Category 42 (Vaccination): 89 = R21
 * - Category 43 (Vector Control): 90 = LSM
 * - Category 44 (IRS): 91 = IRS Pyrethroid, 92 = IRS Organophosphate, 93 = IRS Carbamate
 * - Category 45 (MDA): 94 = MDA Single Round, 95 = MDA Multiple Rounds
 *
 * Metric Type IDs:
 * - Seasonality: 413
 * - Mortality rate: 407
 * - Incidence rate: 410
 * - Insecticide resistance: 412
 * - Clinical attack rate: 417
 * - Vector outdoor biting: 418
 * - Vector indoor resting: 419
 * - Urban classification: 420
 * - PfPr2-10 (Malaria prevalence): 411
 * - LLIN usage: 416
 */

// Category IDs
const CATEGORY_CM = 37;
const CATEGORY_IPTP = 38;            // IPTp
const CATEGORY_CHEMOPREVENTION = 39; // PMC & SMC
const CATEGORY_NETS_CAMPAIGN = 40;   // ITN Campaign
const CATEGORY_NETS_ROUTINE = 41;    // ITN Routine
const CATEGORY_VACCINATION = 42;     // Vaccination
const CATEGORY_VECTOR_CONTROL = 43;  // Vector Control (LSM)
const CATEGORY_IRS = 44;             // IRS
const CATEGORY_MDA = 45;             // MDA

// Intervention IDs
const INTERVENTION_CM = 78;
const INTERVENTION_IPTP = 80;
const INTERVENTION_SMC = 82;
const INTERVENTION_PMC = 81;
const INTERVENTION_STANDARD_PYRETHROID_CAMPAIGN = 85;
const INTERVENTION_PBO_CAMPAIGN = 84;
const INTERVENTION_DUAL_AI_CAMPAIGN = 83;
const INTERVENTION_STANDARD_PYRETHROID_ROUTINE = 88;
const INTERVENTION_PBO_ROUTINE = 87;
const INTERVENTION_DUAL_AI_ROUTINE = 86;
const INTERVENTION_R21 = 89;
const INTERVENTION_IRS_PYRETHROID = 91; // eslint-disable-line @typescript-eslint/no-unused-vars
const INTERVENTION_IRS_ORGANOPHOSPHATE = 92;
const INTERVENTION_IRS_CARBAMATE = 93; // eslint-disable-line @typescript-eslint/no-unused-vars
const INTERVENTION_MDA_SINGLE = 94; // eslint-disable-line @typescript-eslint/no-unused-vars
const INTERVENTION_LSM = 90;
const INTERVENTION_MDA_MULTIPLE = 95;

// Metric Type IDs
const METRIC_SEASONALITY = 413;
const METRIC_MORTALITY_RATE = 407;
const METRIC_INCIDENCE_RATE = 410;
const METRIC_INSECTICIDE_RESISTANCE = 412;
const METRIC_PREVALENCE = 411;            // PfPr2-10
const METRIC_LLIN_USAGE = 416; // eslint-disable-line @typescript-eslint/no-unused-vars
const METRIC_CLINICAL_ATTACK_RATE = 417;
const METRIC_VECTOR_OUTDOOR_BITING = 418;
const METRIC_VECTOR_INDOOR_RESTING = 419;
const METRIC_URBAN_CLASSIFICATION = 420; // eslint-disable-line @typescript-eslint/no-unused-vars

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
    // Rule 1: High Seasonality, High Mortality
    // Interventions: Dual AI nets (campaign + routine), SMC, R21
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
        [CATEGORY_VACCINATION, INTERVENTION_R21], // R21
      ]),
      isAllDistricts: false,
    },
    // Rule 2: Low Seasonality, High Incidence, High Mortality, High Resistance
    // Interventions: Dual AI nets (campaign + routine), PMC, R21
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
        [CATEGORY_VACCINATION, INTERVENTION_R21], // R21
      ]),
      isAllDistricts: false,
    },
    // Rule 3: Low Seasonality, High Incidence, Low Mortality, High Resistance
    // Interventions: Dual AI nets (campaign + routine), PMC (no R21)
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
      ]),
      isAllDistricts: false,
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
    
  ],
};

/**
 * WHO GUIDELINES PLAN (2024)
 *
 * Complete implementation of WHO-recommended intervention criteria for malaria control.
 * Based on WHO guidelines table with all interventions and metrics.
 *
 * RULE PRIORITY (evaluated in order, later rules override earlier ones):
 * 1. Default - Standard pyrethroid nets + CM (all remaining districts)
 * 2. ITNs/LLINS - Incidence >100, PfPr2-10 >1%, indoor-biting vectors
 * 3. IRS - Incidence >250, PfPr2-10 >10%, LLIN use <40%, high resistance, indoor-resting vectors
 * 4. SMC - High seasonality, PfPr2-10 >10%, clinical attack rate >0.1
 * 5. PMC - Incidence >250, PfPr2-10 >10%, non-seasonal, exclude SMC areas
 * 6. IPTp - Incidence >250, PfPr2-10 >10%
 * 7. MDA - Incidence >450, PfPr2-10 >35% (elimination settings)
 * 8. RTS,S - Incidence >250
 */
const WHO_GUIDELINES_PLAN: PlanDefinition = {
  id: "who-guidelines",
  name: "WHO Guidelines",
  description: "WHO-recommended intervention criteria for malaria control (2024). All interventions fully implemented.",
  rules: [
    // DEFAULT RULE - All remaining districts
    {
      id: "who-default",
      title: "Default - Standard Prevention",
      color: "#9ca3af", // Gray
      criteria: [],
      interventionsByCategory: new Map([
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_STANDARD_PYRETHROID_CAMPAIGN],
        [CATEGORY_NETS_ROUTINE, INTERVENTION_STANDARD_PYRETHROID_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
      isAllDistricts: true,
    },

    // RULE 1: ITNs/LLINS
    // WHO Criteria: Incidence > 100/1000, PfPr2-10 > 1%, indoor-biting vectors
    {
      id: "who-itns",
      title: "ITNs/LLINS",
      color: "#f97316", // Orange
      criteria: [
        {
          id: "itns-incidence",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          value: "100",
        },
        {
          id: "itns-prevalence",
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          value: "0",
        },
        {
          id: "itns-indoor-biting",
          metricTypeId: METRIC_VECTOR_OUTDOOR_BITING,
          operator: "<",
          value: "0.5", // < 50% outdoor biting (majority indoor)
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_PBO_CAMPAIGN], // PBO nets for better protection
        [CATEGORY_NETS_ROUTINE, INTERVENTION_PBO_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },

    // RULE 2: IRS
    // WHO Criteria: Incidence > 250/1000, PfPr2-10 > 10%, LLIN use < 40%,
    //               insecticide resistance, indoor-resting vectors
    {
      id: "who-irs",
      title: "IRS",
      color: "#3b82f6", // Blue
      criteria: [
        {
          id: "irs-incidence",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          value: "250",
        },
        {
          id: "irs-prevalence",
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          value: ".10",
        },
        /*{
          id: "irs-llin-low",
          metricTypeId: METRIC_LLIN_USAGE,
          operator: "<",
          value: "0.4", // < 40% LLIN use
        },*/
        {
          id: "irs-resistance",
          metricTypeId: METRIC_INSECTICIDE_RESISTANCE,
          operator: ">",
          value: "0.5", // > 50% survival (high resistance)
        },
        {
          id: "irs-indoor-resting",
          metricTypeId: METRIC_VECTOR_INDOOR_RESTING,
          operator: ">",
          value: "0.5", // > 50% rest indoors (IRS effective)
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_IRS, INTERVENTION_IRS_ORGANOPHOSPHATE], // Use non-pyrethroid for resistance
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_PBO_CAMPAIGN],
        [CATEGORY_NETS_ROUTINE, INTERVENTION_PBO_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },

    // RULE 3: SMC (4 cycles)
    // WHO Criteria: Seasonality, PfPr2-10 > 10%, clinical attack rate > 0.1 episodes
    {
      id: "who-smc",
      title: "SMC (4 cycles)",
      color: "#22c55e", // Green
      criteria: [
        {
          id: "smc-seasonality",
          metricTypeId: METRIC_SEASONALITY,
          operator: ">=",
          value: "0.6", // High seasonality (≥60% rain in 4 wettest months)
        },
        {
          id: "smc-prevalence",
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          value: ".10",
        },
        {
          id: "smc-attack-rate",
          metricTypeId: METRIC_CLINICAL_ATTACK_RATE,
          operator: ">",
          value: "0.1", // > 0.1 episodes per child per year
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_CHEMOPREVENTION, INTERVENTION_SMC], // SMC (SP+AQ)
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_PBO_CAMPAIGN],
        [CATEGORY_NETS_ROUTINE, INTERVENTION_PBO_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },

    // RULE 4: PMC
    // WHO Criteria: Incidence > 250/1000, PfPr2-10 > 10%, exclude SMC areas (non-seasonal)
    {
      id: "who-pmc",
      title: "PMC",
      color: "#a855f7", // Purple
      criteria: [
        {
          id: "pmc-incidence",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          value: "250",
        },
        {
          id: "pmc-prevalence",
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          value: ".10",
        },
        {
          id: "pmc-low-seasonality",
          metricTypeId: METRIC_SEASONALITY,
          operator: "<",
          value: "0.6", // Non-seasonal (< 60% - excludes SMC areas)
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_CHEMOPREVENTION, INTERVENTION_PMC], // PMC (SP)
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_PBO_CAMPAIGN],
        [CATEGORY_NETS_ROUTINE, INTERVENTION_PBO_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },

    // RULE 5: IPTp
    // WHO Criteria: Incidence > 250/1000, PfPr2-10 > 10%
    {
      id: "who-iptp",
      title: "IPTp",
      color: "#06b6d4", // Cyan
      criteria: [
        {
          id: "iptp-incidence",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          value: "250",
        },
        {
          id: "iptp-prevalence",
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          value: ".10",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_IPTP, INTERVENTION_IPTP], // IPTp (SP)
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_PBO_CAMPAIGN],
        [CATEGORY_NETS_ROUTINE, INTERVENTION_PBO_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },

    // RULE 6: MDA
    // WHO Criteria: Incidence > 450/1000, PfPr2-10 > 35% (elimination settings)
    {
      id: "who-mda",
      title: "MDA",
      color: "#ec4899", // Pink
      criteria: [
        {
          id: "mda-incidence",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          value: "450",
        },
        {
          id: "mda-prevalence",
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          value: ".35",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_MDA, INTERVENTION_MDA_MULTIPLE], // Multiple rounds for high burden
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_DUAL_AI_CAMPAIGN], // Dual AI for high burden
        [CATEGORY_NETS_ROUTINE, INTERVENTION_DUAL_AI_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },

    // RULE 7: RTS,S Vaccination
    // WHO Criteria: Incidence > 250/1000
    {
      id: "who-rtss",
      title: "RTS,S Vaccination",
      color: "#f59e0b", // Amber
      criteria: [
        {
          id: "rtss-incidence",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          value: "250",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_VACCINATION, INTERVENTION_R21], // R21 vaccine (proxy for RTS,S)
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_PBO_CAMPAIGN],
        [CATEGORY_NETS_ROUTINE, INTERVENTION_PBO_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },
  ],
};

/**
 * WHO GUIDELINES PLAN - CUMULATIVE VERSION (2024)
 *
 * Cumulative implementation where interventions stack as burden increases.
 * Unlike the standard WHO plan where rules override, this plan adds interventions
 * progressively as districts meet higher thresholds.
 *
 * CUMULATIVE LOGIC:
 * - Incidence >100: Upgrade to PBO nets
 * - Incidence >250: Add R21 vaccination (cumulative with PBO nets)
 * - Incidence >250 + Prevalence >10% + Non-seasonal: Add PMC + IPTp (cumulative with R21)
 * - Incidence >250 + Prevalence >10% + Seasonal: Add SMC (cumulative with R21)
 * - Incidence >250 + High resistance: Add IRS (cumulative with R21)
 * - Incidence >450 + Prevalence >35%: Add MDA (cumulative with R21 + Dual AI nets)
 *
 * Example: A district with Incidence=500, Prevalence=40% gets:
 *   - Dual AI nets (highest level)
 *   - R21 vaccine (from >250 threshold)
 *   - MDA (from >450 + >35% threshold)
 *   - CM (always included)
 */
const WHO_GUIDELINES_CUMULATIVE_PLAN: PlanDefinition = {
  id: "who-guidelines-cumulative",
  name: "WHO Guidelines (Cumulative)",
  description: "WHO-recommended interventions with cumulative stacking - higher burden areas receive all applicable interventions.",
  rules: [
    // DEFAULT RULE - All remaining districts
    {
      id: "who-cum-default",
      title: "Default - Standard Prevention",
      color: "#9ca3af", // Gray
      criteria: [],
      interventionsByCategory: new Map([
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_STANDARD_PYRETHROID_CAMPAIGN],
        [CATEGORY_NETS_ROUTINE, INTERVENTION_STANDARD_PYRETHROID_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
      isAllDistricts: true,
    },

    // RULE 1: ITNs/LLINS - Upgrade to PBO nets
    {
      id: "who-cum-itns",
      title: "ITNs/LLINS",
      color: "#f97316", // Orange
      criteria: [
        {
          id: "itns-incidence",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          value: "100",
        },
        {
          id: "itns-prevalence",
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          value: "0.01",
        },
        {
          id: "itns-indoor-biting",
          metricTypeId: METRIC_VECTOR_OUTDOOR_BITING,
          operator: "<",
          value: "0.5",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_PBO_CAMPAIGN],
        [CATEGORY_NETS_ROUTINE, INTERVENTION_PBO_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },

    // RULE 2: RTS,S Vaccination - Add R21 for moderate-high burden
    {
      id: "who-cum-rtss",
      title: "RTS,S Vaccination",
      color: "#f59e0b", // Amber
      criteria: [
        {
          id: "rtss-incidence",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          value: "250",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_VACCINATION, INTERVENTION_R21], // Add R21
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_PBO_CAMPAIGN], // Maintain PBO nets
        [CATEGORY_NETS_ROUTINE, INTERVENTION_PBO_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },

    // RULE 3: IRS - Add IRS for high resistance areas
    {
      id: "who-cum-irs",
      title: "IRS + R21",
      color: "#3b82f6", // Blue
      criteria: [
        {
          id: "irs-incidence",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          value: "250",
        },
        {
          id: "irs-prevalence",
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          value: "0.10",
        },
        {
          id: "irs-resistance",
          metricTypeId: METRIC_INSECTICIDE_RESISTANCE,
          operator: ">",
          value: "0.5",
        },
        {
          id: "irs-indoor-resting",
          metricTypeId: METRIC_VECTOR_INDOOR_RESTING,
          operator: ">",
          value: "0.5",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_IRS, INTERVENTION_IRS_ORGANOPHOSPHATE], // Add IRS
        [CATEGORY_VACCINATION, INTERVENTION_R21], // Cumulative: Keep R21
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_PBO_CAMPAIGN],
        [CATEGORY_NETS_ROUTINE, INTERVENTION_PBO_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },

    // RULE 4: SMC - Add SMC for seasonal areas
    {
      id: "who-cum-smc",
      title: "SMC + R21",
      color: "#22c55e", // Green
      criteria: [
        {
          id: "smc-seasonality",
          metricTypeId: METRIC_SEASONALITY,
          operator: ">=",
          value: "0.6",
        },
        {
          id: "smc-prevalence",
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          value: "0.10",
        },
        {
          id: "smc-attack-rate",
          metricTypeId: METRIC_CLINICAL_ATTACK_RATE,
          operator: ">",
          value: "0.1",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_CHEMOPREVENTION, INTERVENTION_SMC], // Add SMC
        [CATEGORY_VACCINATION, INTERVENTION_R21], // Cumulative: Keep R21 (if incidence >250)
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_PBO_CAMPAIGN],
        [CATEGORY_NETS_ROUTINE, INTERVENTION_PBO_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },

    // RULE 5: PMC + IPTp - Add both for non-seasonal high burden
    {
      id: "who-cum-pmc-iptp",
      title: "PMC + IPTp + R21",
      color: "#a855f7", // Purple
      criteria: [
        {
          id: "pmc-incidence",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          value: "250",
        },
        {
          id: "pmc-prevalence",
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          value: "0.10",
        },
        {
          id: "pmc-low-seasonality",
          metricTypeId: METRIC_SEASONALITY,
          operator: "<",
          value: "0.6",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_CHEMOPREVENTION, INTERVENTION_PMC], // Add PMC
        [CATEGORY_IPTP, INTERVENTION_IPTP], // Add IPTp
        [CATEGORY_VACCINATION, INTERVENTION_R21], // Cumulative: Keep R21
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_PBO_CAMPAIGN],
        [CATEGORY_NETS_ROUTINE, INTERVENTION_PBO_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },

    // RULE 6: MDA - Add MDA for very high burden (cumulative with R21)
    {
      id: "who-cum-mda",
      title: "MDA + R21",
      color: "#ec4899", // Pink
      criteria: [
        {
          id: "mda-incidence",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          value: "450",
        },
        {
          id: "mda-prevalence",
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          value: "0.35",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_MDA, INTERVENTION_MDA_MULTIPLE], // Add MDA
        [CATEGORY_VACCINATION, INTERVENTION_R21], // Cumulative: Keep R21 (incidence >450 also >250)
        [CATEGORY_NETS_CAMPAIGN, INTERVENTION_DUAL_AI_CAMPAIGN], // Upgrade to Dual AI for highest burden
        [CATEGORY_NETS_ROUTINE, INTERVENTION_DUAL_AI_ROUTINE],
        [CATEGORY_CM, INTERVENTION_CM],
      ]),
    },
  ],
};

/**
 * Test Plan
 * Simple 2-rule plan for testing cumulative mode behavior.
 */
const TEST_PLAN: PlanDefinition = {
  id: "test",
  name: "Test",
  description: "Simple test plan with two rules for verifying cumulative mode",
  rules: [
    {
      id: "test-rule-1",
      title: "High Incidence → R21",
      color: RULE_COLORS[0],
      criteria: [
        {
          id: "test-r1-c1",
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          value: "250",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_VACCINATION, INTERVENTION_R21],
      ]),
      isAllDistricts: false,
    },
    {
      id: "test-rule-2",
      title: "High Seasonality → LSM",
      color: RULE_COLORS[1],
      criteria: [
        {
          id: "test-r2-c1",
          metricTypeId: METRIC_SEASONALITY,
          operator: ">",
          value: "0.6",
        },
      ],
      interventionsByCategory: new Map([
        [CATEGORY_VECTOR_CONTROL, INTERVENTION_LSM],
      ]),
      isAllDistricts: false,
    },
  ],
};

/**
 * All predefined plans
 */
export const PREDEFINED_PLANS: PlanDefinition[] = [BAU_PLAN, NSP_2026_30_PLAN, WHO_GUIDELINES_PLAN, WHO_GUIDELINES_CUMULATIVE_PLAN, TEST_PLAN];

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
