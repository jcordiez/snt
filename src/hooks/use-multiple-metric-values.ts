"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { MetricValue } from "@/types/intervention";

async function fetchMetricValues(id: number): Promise<MetricValue[]> {
  const response = await fetch(`/api/metricvalues?id=${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch metric values for type ${id}`);
  }
  return response.json();
}

/**
 * Hook to load metric values for multiple metric type IDs at once.
 * Returns a map of metricTypeId -> orgUnitId -> value
 */
export function useMultipleMetricValues(metricTypeIds: number[]) {
  const queries = useQueries({
    queries: metricTypeIds.map((id) => ({
      queryKey: queryKeys.metricValues(id),
      queryFn: () => fetchMetricValues(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error ?? null;

  // Create a nested map: metricTypeId -> orgUnitId -> value
  const metricValuesByType = useMemo(() => {
    const result: Record<number, Record<number, number>> = {};

    for (let i = 0; i < metricTypeIds.length; i++) {
      const id = metricTypeIds[i];
      const query = queries[i];
      if (query.data) {
        result[id] = {};
        for (const item of query.data) {
          result[id][item.org_unit] = item.value;
        }
      }
    }

    return result;
  }, [metricTypeIds, queries]);

  return { metricValuesByType, isLoading, error };
}
