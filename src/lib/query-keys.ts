export const queryKeys = {
  orgUnits: ['orgunits'] as const,
  interventionCategories: ['intervention-categories'] as const,
  metricTypes: ['metric-types'] as const,
  metricValues: (id: number) => ['metric-values', id] as const,
  allMetricValues: (ids: number[]) => ['metric-values', { ids }] as const,
};
