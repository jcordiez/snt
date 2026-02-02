/**
 * WHO Intervention Guidelines (2024)
 *
 * Extracts and formats WHO-recommended criteria for each malaria intervention
 * from the WHO_GUIDELINES_PLAN in predefined-plans.ts
 */

export interface GuidelineCriterion {
  id: string;
  indicatorName: string;
  metricTypeId: number;
  operator: string;
  threshold: string;
  dataSource: string;
  description?: string;
}

export interface InterventionGuideline {
  id: string;
  name: string;
  description: string;
  criteria: GuidelineCriterion[];
}

// Metric Type ID constants (from predefined-plans.ts)
const METRIC_SEASONALITY = 413;
const METRIC_INCIDENCE_RATE = 410;
const METRIC_INSECTICIDE_RESISTANCE = 412;
const METRIC_PREVALENCE = 411; // PfPr2-10
const METRIC_LLIN_USAGE = 416;
const METRIC_CLINICAL_ATTACK_RATE = 417;
const METRIC_VECTOR_OUTDOOR_BITING = 418;
const METRIC_VECTOR_INDOOR_RESTING = 419;

// Data source mapping for each metric type
const METRIC_DATA_SOURCES: Record<number, string> = {
  [METRIC_INCIDENCE_RATE]: "DHIS",
  [METRIC_PREVALENCE]: "MAP",
  [METRIC_SEASONALITY]: "DHIS",
  [METRIC_INSECTICIDE_RESISTANCE]: "MAP",
  [METRIC_CLINICAL_ATTACK_RATE]: "MIS",
  [METRIC_VECTOR_OUTDOOR_BITING]: "MAP",
  [METRIC_VECTOR_INDOOR_RESTING]: "MAP",
  [METRIC_LLIN_USAGE]: "DHS",
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
  [METRIC_LLIN_USAGE]: "LLIN Usage",
};

// Metric descriptions for tooltips
const METRIC_DESCRIPTIONS: Record<number, string> = {
  [METRIC_INCIDENCE_RATE]: "Number of confirmed malaria cases per 1,000 population per year",
  [METRIC_PREVALENCE]: "Percentage of children aged 2-10 with Plasmodium falciparum parasites",
  [METRIC_SEASONALITY]: "Proportion of annual rainfall in the 4 wettest consecutive months (0-1 scale)",
  [METRIC_INSECTICIDE_RESISTANCE]: "Percentage of mosquitoes surviving insecticide exposure (>0.5 indicates high resistance)",
  [METRIC_CLINICAL_ATTACK_RATE]: "Number of clinical malaria episodes per child per year",
  [METRIC_VECTOR_OUTDOOR_BITING]: "Proportion of mosquito biting occurring outdoors (0-1 scale)",
  [METRIC_VECTOR_INDOOR_RESTING]: "Proportion of mosquitoes resting indoors after blood meal (0-1 scale)",
  [METRIC_LLIN_USAGE]: "Percentage of population sleeping under long-lasting insecticidal nets",
};

// Format threshold value for display
function formatThreshold(operator: string, value: string, metricTypeId: number): string {
  const numValue = parseFloat(value);

  // Convert decimal values to percentages for certain metrics
  if (metricTypeId === METRIC_PREVALENCE && numValue < 1) {
    return `${operator} ${(numValue * 100).toFixed(0)}%`;
  }

  if (metricTypeId === METRIC_SEASONALITY ||
      metricTypeId === METRIC_INSECTICIDE_RESISTANCE ||
      metricTypeId === METRIC_VECTOR_OUTDOOR_BITING ||
      metricTypeId === METRIC_VECTOR_INDOOR_RESTING) {
    if (numValue < 1) {
      return `${operator} ${(numValue * 100).toFixed(0)}%`;
    }
  }

  if (metricTypeId === METRIC_LLIN_USAGE && numValue < 1) {
    return `${operator} ${(numValue * 100).toFixed(0)}%`;
  }

  if (metricTypeId === METRIC_CLINICAL_ATTACK_RATE) {
    return `${operator} ${value} episodes/child/year`;
  }

  if (metricTypeId === METRIC_INCIDENCE_RATE) {
    return `${operator} ${value}/1,000/year`;
  }

  return `${operator} ${value}`;
}

/**
 * WHO Intervention Guidelines
 * Extracted from WHO_GUIDELINES_PLAN rules (lines 298-543 in predefined-plans.ts)
 */
export const INTERVENTION_GUIDELINES: InterventionGuideline[] = [
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
    id: "irs",
    name: "IRS",
    description: "Indoor Residual Spraying for areas with high burden, insecticide resistance, and indoor-resting vectors",
    criteria: [
      {
        id: "irs-incidence",
        indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
        metricTypeId: METRIC_INCIDENCE_RATE,
        operator: ">",
        threshold: "250",
        dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
        description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
      },
      {
        id: "irs-prevalence",
        indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
        metricTypeId: METRIC_PREVALENCE,
        operator: ">",
        threshold: "0.10",
        dataSource: METRIC_DATA_SOURCES[METRIC_PREVALENCE],
        description: METRIC_DESCRIPTIONS[METRIC_PREVALENCE],
      },
      {
        id: "irs-resistance",
        indicatorName: METRIC_DISPLAY_NAMES[METRIC_INSECTICIDE_RESISTANCE],
        metricTypeId: METRIC_INSECTICIDE_RESISTANCE,
        operator: ">",
        threshold: "0.5",
        dataSource: METRIC_DATA_SOURCES[METRIC_INSECTICIDE_RESISTANCE],
        description: METRIC_DESCRIPTIONS[METRIC_INSECTICIDE_RESISTANCE],
      },
      {
        id: "irs-indoor-resting",
        indicatorName: METRIC_DISPLAY_NAMES[METRIC_VECTOR_INDOOR_RESTING],
        metricTypeId: METRIC_VECTOR_INDOOR_RESTING,
        operator: ">",
        threshold: "0.5",
        dataSource: METRIC_DATA_SOURCES[METRIC_VECTOR_INDOOR_RESTING],
        description: METRIC_DESCRIPTIONS[METRIC_VECTOR_INDOOR_RESTING],
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
    id: "mda",
    name: "MDA",
    description: "Mass Drug Administration for very high burden areas targeting elimination",
    criteria: [
      {
        id: "mda-incidence",
        indicatorName: METRIC_DISPLAY_NAMES[METRIC_INCIDENCE_RATE],
        metricTypeId: METRIC_INCIDENCE_RATE,
        operator: ">",
        threshold: "450",
        dataSource: METRIC_DATA_SOURCES[METRIC_INCIDENCE_RATE],
        description: METRIC_DESCRIPTIONS[METRIC_INCIDENCE_RATE],
      },
      {
        id: "mda-prevalence",
        indicatorName: METRIC_DISPLAY_NAMES[METRIC_PREVALENCE],
        metricTypeId: METRIC_PREVALENCE,
        operator: ">",
        threshold: "0.35",
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
];

/**
 * Get formatted threshold display for a criterion
 */
export function getFormattedThreshold(criterion: GuidelineCriterion): string {
  return formatThreshold(criterion.operator, criterion.threshold, criterion.metricTypeId);
}

/**
 * Data source full names
 */
export const DATA_SOURCE_NAMES: Record<string, string> = {
  DHIS: "District Health Information System",
  MAP: "Malaria Atlas Project",
  MIS: "Malaria Indicator Survey",
  DHS: "Demographic and Health Surveys",
};
