export type RuleOperator = '<' | '<=' | '=' | '>=' | '>';

export interface Rule {
  id: string;
  metricTypeId: number | null;
  operator: RuleOperator;
  value: string;
}

export interface MetricType {
  id: number;
  account: number;
  name: string;
  category: string;
  description: string;
  source: string;
  units: string;
  unit_symbol: string;
  comments: string;
  legend_config: {
    range: string[];
    domain: number[];
  };
  legend_type: string;
  created_at: string;
  updated_at: string;
}

export interface Intervention {
  id: number;
  name: string;
  short_name: string;
  code: string;
  description: string;
  intervention_category: number;
  created_at: string;
  updated_at: string;
}

export interface InterventionCategory {
  id: number;
  account: number;
  name: string;
  description: string;
  interventions: Intervention[];
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface MetricValue {
  id: number;
  metric_type: number;
  org_unit: number;
  year: number | null;
  value: number;
  string_value: string;
}

export type WizardStep = 'rules' | 'districts' | 'interventions';

export interface AddInterventionState {
  step: WizardStep;
  rules: Rule[];
  selectedDistrictIds: Set<string>;
  selectedInterventionIds: Set<number>;
}
