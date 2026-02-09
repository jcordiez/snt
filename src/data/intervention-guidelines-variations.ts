/**
 * Intervention Guideline Variations
 *
 * Multiple variations of WHO intervention guidelines with different threshold values
 * and criteria to support different strategic approaches and resource scenarios.
 */

import type { InterventionGuideline } from "./intervention-guidelines";

export interface GuidelineVariation {
  id: string;
  name: string;
  description: string;
  focus: string;
  guidelines: InterventionGuideline[];
}

// Metric Type ID constants (from intervention-guidelines.ts)
const METRIC_SEASONALITY = 413;
const METRIC_INCIDENCE_RATE = 410;
const METRIC_INSECTICIDE_RESISTANCE = 412;
const METRIC_PREVALENCE = 411;
const METRIC_CLINICAL_ATTACK_RATE = 417;
const METRIC_VECTOR_OUTDOOR_BITING = 418;
const METRIC_VECTOR_INDOOR_RESTING = 419;

// Data source mapping
const METRIC_DATA_SOURCES: Record<number, string> = {
  [METRIC_INCIDENCE_RATE]: "DHIS",
  [METRIC_PREVALENCE]: "MAP",
  [METRIC_SEASONALITY]: "DHIS",
  [METRIC_INSECTICIDE_RESISTANCE]: "MAP",
  [METRIC_CLINICAL_ATTACK_RATE]: "MIS",
  [METRIC_VECTOR_OUTDOOR_BITING]: "MAP",
  [METRIC_VECTOR_INDOOR_RESTING]: "MAP",
};

// Metric display names
const METRIC_DISPLAY_NAMES: Record<number, string> = {
  [METRIC_INCIDENCE_RATE]: "Incidence Rate",
  [METRIC_PREVALENCE]: "PfPr2-10 (Prevalence)",
  [METRIC_SEASONALITY]: "Seasonality Index",
  [METRIC_INSECTICIDE_RESISTANCE]: "Insecticide Resistance",
  [METRIC_CLINICAL_ATTACK_RATE]: "Clinical Attack Rate",
  [METRIC_VECTOR_OUTDOOR_BITING]: "Vector Outdoor Biting",
  [METRIC_VECTOR_INDOOR_RESTING]: "Vector Indoor Resting",
};

// Metric descriptions
const METRIC_DESCRIPTIONS: Record<number, string> = {
  [METRIC_INCIDENCE_RATE]: "Number of confirmed malaria cases per 1,000 population per year",
  [METRIC_PREVALENCE]: "Percentage of children aged 2-10 with Plasmodium falciparum parasites",
  [METRIC_SEASONALITY]: "Proportion of annual rainfall in the 4 wettest consecutive months (0-1 scale)",
  [METRIC_INSECTICIDE_RESISTANCE]: "Percentage of mosquitoes surviving insecticide exposure (>0.5 indicates high resistance)",
  [METRIC_CLINICAL_ATTACK_RATE]: "Number of clinical malaria episodes per child per year",
  [METRIC_VECTOR_OUTDOOR_BITING]: "Proportion of mosquito biting occurring outdoors (0-1 scale)",
  [METRIC_VECTOR_INDOOR_RESTING]: "Proportion of mosquitoes resting indoors after blood meal (0-1 scale)",
};

/**
 * Variation 1: Conservative (Standard WHO)
 * Uses current WHO thresholds as baseline
 */
const CONSERVATIVE_VARIATION: GuidelineVariation = {
  id: "conservative",
  name: "Conservative (Standard WHO)",
  description: "Standard WHO-recommended thresholds with all interventions included",
  focus: "Most restrictive criteria following official WHO guidelines",
  guidelines: [
    {
      id: "itns-llins",
      name: "ITNs/LLINS",
      description: "Long-lasting insecticidal nets for malaria prevention in areas with indoor-biting vectors",
      criteria: [
        {
          id: "itns-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "100",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
        {
          id: "itns-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.01",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
        {
          id: "itns-indoor-biting",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_VECTOR_OUTDOOR_BITING],
          metricTypeId: METRIC_VECTOR_OUTDOOR_BITING,
          operator: "<",
          threshold: "0.5",
          dataSource: METRIC_DATA_SOURCES[METRIC_VECTOR_OUTDOOR_BITING],
          description: METRIC_DESCRIPTIONS[METRIC_VECTOR_OUTDOOR_BITING],
        },
      ],
    },
    {
      id: "smc",
      name: "SMC (4 cycles)",
      description: "Seasonal Malaria Chemoprevention for high-burden seasonal areas",
      criteria: [
        {
          id: "smc-seasonality",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_SEASONALITY],
          metricTypeId: METRIC_SEASONALITY,
          operator: "≥",
          threshold: "0.6",
          dataSource: METRIC_DATA_SOURCES[METRIC_SEASONALITY],
          description: METRIC_DESCRIPTIONS[METRIC_SEASONALITY],
        },
        {
          id: "smc-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.10",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
        {
          id: "smc-attack-rate",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_CLINICAL_ATTACK_RATE],
          metricTypeId: METRIC_CLINICAL_ATTACK_RATE,
          operator: ">",
          threshold: "0.1",
          dataSource: METRIC_DATA_SOURCES[METRIC_CLINICAL_ATTACK_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_CLINICAL_ATTACK_RATE],
        },
      ],
    },
    {
      id: "pmc",
      name: "PMC",
      description: "Perennial Malaria Chemoprevention for high-burden non-seasonal areas",
      criteria: [
        {
          id: "pmc-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "250",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
        {
          id: "pmc-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.10",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
        {
          id: "pmc-low-seasonality",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_SEASONALITY],
          metricTypeId: METRIC_SEASONALITY,
          operator: "<",
          threshold: "0.6",
          dataSource: METRIC_DATA_SOURCES[METRIC_SEASONALITY],
          description: METRIC_DESCRIPTIONS[METRIC_SEASONALITY],
        },
      ],
    },
    {
      id: "iptp",
      name: "IPTp",
      description: "Intermittent Preventive Treatment in Pregnancy for moderate-to-high transmission areas",
      criteria: [
        {
          id: "iptp-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "250",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
        {
          id: "iptp-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.10",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
      ],
    },
    {
      id: "rtss",
      name: "RTS,S Vaccination",
      description: "Malaria vaccine for areas with moderate-to-high transmission",
      criteria: [
        {
          id: "rtss-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "250",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
      ],
    },
  ],
};

/**
 * Variation 2: Moderate (Resource-Constrained)
 * Increases thresholds for cost-effective interventions
 */
const MODERATE_VARIATION: GuidelineVariation = {
  id: "moderate",
  name: "Moderate (Resource-Constrained)",
  description: "Focus on most cost-effective interventions with higher thresholds",
  focus: "Optimized for resource-constrained settings",
  guidelines: [
    {
      id: "itns-llins",
      name: "ITNs/LLINS",
      description: "Long-lasting insecticidal nets for malaria prevention",
      criteria: [
        {
          id: "itns-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "150",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
        {
          id: "itns-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.02",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
      ],
    },
    {
      id: "smc",
      name: "SMC (4 cycles)",
      description: "Seasonal Malaria Chemoprevention for high-burden seasonal areas",
      criteria: [
        {
          id: "smc-seasonality",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_SEASONALITY],
          metricTypeId: METRIC_SEASONALITY,
          operator: "≥",
          threshold: "0.6",
          dataSource: METRIC_DATA_SOURCES[METRIC_SEASONALITY],
          description: METRIC_DESCRIPTIONS[METRIC_SEASONALITY],
        },
        {
          id: "smc-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.15",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
      ],
    },
    {
      id: "pmc",
      name: "PMC",
      description: "Perennial Malaria Chemoprevention for high-burden non-seasonal areas",
      criteria: [
        {
          id: "pmc-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "300",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
        {
          id: "pmc-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.15",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
        {
          id: "pmc-low-seasonality",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_SEASONALITY],
          metricTypeId: METRIC_SEASONALITY,
          operator: "<",
          threshold: "0.6",
          dataSource: METRIC_DATA_SOURCES[METRIC_SEASONALITY],
          description: METRIC_DESCRIPTIONS[METRIC_SEASONALITY],
        },
      ],
    },
    {
      id: "iptp",
      name: "IPTp",
      description: "Intermittent Preventive Treatment in Pregnancy",
      criteria: [
        {
          id: "iptp-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "300",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
        {
          id: "iptp-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.15",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
      ],
    },
    {
      id: "rtss",
      name: "RTS,S Vaccination",
      description: "Malaria vaccine for areas with moderate-to-high transmission",
      criteria: [
        {
          id: "rtss-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "300",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
      ],
    },
  ],
};

/**
 * Variation 3: Aggressive (High-Risk Areas)
 * Lower thresholds to maximize coverage in high-burden areas
 */
const AGGRESSIVE_VARIATION: GuidelineVariation = {
  id: "aggressive",
  name: "Aggressive (High-Risk Areas)",
  description: "Lower thresholds for maximum coverage in high-burden areas",
  focus: "Cast a wider net to maximize intervention coverage",
  guidelines: [
    {
      id: "itns-llins",
      name: "ITNs/LLINS",
      description: "Long-lasting insecticidal nets for malaria prevention",
      criteria: [
        {
          id: "itns-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "50",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
        {
          id: "itns-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.005",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
      ],
    },
    {
      id: "smc",
      name: "SMC (4 cycles)",
      description: "Seasonal Malaria Chemoprevention for seasonal areas",
      criteria: [
        {
          id: "smc-seasonality",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_SEASONALITY],
          metricTypeId: METRIC_SEASONALITY,
          operator: "≥",
          threshold: "0.5",
          dataSource: METRIC_DATA_SOURCES[METRIC_SEASONALITY],
          description: METRIC_DESCRIPTIONS[METRIC_SEASONALITY],
        },
        {
          id: "smc-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.05",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
      ],
    },
    {
      id: "pmc",
      name: "PMC",
      description: "Perennial Malaria Chemoprevention for non-seasonal areas",
      criteria: [
        {
          id: "pmc-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "150",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
        {
          id: "pmc-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.05",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
        {
          id: "pmc-low-seasonality",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_SEASONALITY],
          metricTypeId: METRIC_SEASONALITY,
          operator: "<",
          threshold: "0.6",
          dataSource: METRIC_DATA_SOURCES[METRIC_SEASONALITY],
          description: METRIC_DESCRIPTIONS[METRIC_SEASONALITY],
        },
      ],
    },
    {
      id: "iptp",
      name: "IPTp",
      description: "Intermittent Preventive Treatment in Pregnancy",
      criteria: [
        {
          id: "iptp-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "150",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
        {
          id: "iptp-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.05",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
      ],
    },
    {
      id: "rtss",
      name: "RTS,S Vaccination",
      description: "Malaria vaccine for transmission areas",
      criteria: [
        {
          id: "rtss-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "150",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
      ],
    },
  ],
};

/**
 * Variation 4: Targeted (Seasonal Focus)
 * Removes PMC, emphasizes seasonal interventions
 */
const TARGETED_VARIATION: GuidelineVariation = {
  id: "targeted",
  name: "Targeted (Seasonal Focus)",
  description: "Emphasis on seasonal interventions with stricter seasonality requirements",
  focus: "Optimized for areas with strong seasonal transmission patterns",
  guidelines: [
    {
      id: "itns-llins",
      name: "ITNs/LLINS",
      description: "Long-lasting insecticidal nets for malaria prevention",
      criteria: [
        {
          id: "itns-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "100",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
        {
          id: "itns-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.01",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
      ],
    },
    {
      id: "smc",
      name: "SMC (4 cycles)",
      description: "Seasonal Malaria Chemoprevention with stricter seasonality requirements",
      criteria: [
        {
          id: "smc-seasonality",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_SEASONALITY],
          metricTypeId: METRIC_SEASONALITY,
          operator: "≥",
          threshold: "0.7",
          dataSource: METRIC_DATA_SOURCES[METRIC_SEASONALITY],
          description: METRIC_DESCRIPTIONS[METRIC_SEASONALITY],
        },
        {
          id: "smc-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.15",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
        {
          id: "smc-attack-rate",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_CLINICAL_ATTACK_RATE],
          metricTypeId: METRIC_CLINICAL_ATTACK_RATE,
          operator: ">",
          threshold: "0.15",
          dataSource: METRIC_DATA_SOURCES[METRIC_CLINICAL_ATTACK_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_CLINICAL_ATTACK_RATE],
        },
      ],
    },
    {
      id: "iptp",
      name: "IPTp",
      description: "Intermittent Preventive Treatment in Pregnancy",
      criteria: [
        {
          id: "iptp-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "250",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
        {
          id: "iptp-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.10",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
      ],
    },
    {
      id: "rtss",
      name: "RTS,S Vaccination",
      description: "Malaria vaccine for moderate-to-high transmission areas",
      criteria: [
        {
          id: "rtss-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "250",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
      ],
    },
  ],
};

/**
 * Variation 5: Elimination Focus (Low Transmission)
 * For areas moving toward elimination, lower thresholds
 */
const ELIMINATION_VARIATION: GuidelineVariation = {
  id: "elimination",
  name: "Elimination Focus (Low Transmission)",
  description: "Lower thresholds for areas moving toward malaria elimination",
  focus: "Targets low-transmission settings with elimination goals",
  guidelines: [
    {
      id: "itns-llins",
      name: "ITNs/LLINS",
      description: "Long-lasting insecticidal nets for low transmission prevention",
      criteria: [
        {
          id: "itns-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "50",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
        {
          id: "itns-prevalence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
          metricTypeId: METRIC_PREVALENCE,
          operator: ">",
          threshold: "0.005",
          dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
          description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
        },
      ],
    },
    {
      id: "smc",
      name: "SMC (4 cycles)",
      description: "Seasonal Malaria Chemoprevention for elimination",
      criteria: [
        {
          id: "smc-seasonality",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_SEASONALITY],
          metricTypeId: METRIC_SEASONALITY,
          operator: "≥",
          threshold: "0.6",
          dataSource: METRIC_DATA_SOURCES[METRIC_SEASONALITY],
          description: METRIC_DESCRIPTIONS[METRIC_SEASONALITY],
        },
        {
          id: "smc-attack-rate",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_CLINICAL_ATTACK_RATE],
          metricTypeId: METRIC_CLINICAL_ATTACK_RATE,
          operator: ">",
          threshold: "0.05",
          dataSource: METRIC_DATA_SOURCES[METRIC_CLINICAL_ATTACK_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_CLINICAL_ATTACK_RATE],
        },
      ],
    },
    {
      id: "pmc",
      name: "PMC",
      description: "Perennial Malaria Chemoprevention for elimination",
      criteria: [
        {
          id: "pmc-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "100",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
      ],
    },
    {
      id: "iptp",
      name: "IPTp",
      description: "Intermittent Preventive Treatment in Pregnancy",
      criteria: [
        {
          id: "iptp-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "100",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
      ],
    },
    {
      id: "rtss",
      name: "RTS,S Vaccination",
      description: "Malaria vaccine for elimination settings",
      criteria: [
        {
          id: "rtss-incidence",
          indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
          metricTypeId: METRIC_INCIDENCE_RATE,
          operator: ">",
          threshold: "100",
          dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
          description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
        },
      ],
    },
  ],
};

/**
 * All guideline variations
 */
export const GUIDELINE_VARIATIONS: GuidelineVariation[] = [
  CONSERVATIVE_VARIATION,
  TARGETED_VARIATION,
];
