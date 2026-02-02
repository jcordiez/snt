import { RuleOperator } from './intervention';

/**
 * Represents a single criterion in a saved rule.
 * Each criterion filters districts based on a metric comparison.
 */
export interface RuleCriterion {
  id: string;
  metricTypeId: number | null;
  operator: RuleOperator;
  value: string;
}

/**
 * Represents a saved rule that combines selection criteria with intervention assignments.
 * Rules are displayed in the sidebar and can be edited/reapplied.
 */
export interface SavedRule {
  id: string;
  title: string;
  color: string;
  criteria: RuleCriterion[];
  /** Maps categoryId -> interventionId for each assigned intervention */
  interventionsByCategory: Map<number, number>;
  /** Maps categoryId -> coverage percentage (0-100) for each intervention */
  coverageByCategory?: Map<number, number>;
  /** When true, the rule applies to all districts regardless of criteria */
  isAllDistricts?: boolean;
  /** Array of district IDs to exclude from this rule's selection criteria */
  excludedDistrictIds?: string[];
  /** When false, the rule is hidden and not applied to the map or list view */
  isVisible?: boolean;
}
