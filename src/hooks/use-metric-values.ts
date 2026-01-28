"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { MetricValue } from "@/types/intervention";

async function fetchMetricValues(metricTypeId: number): Promise<MetricValue[]> {
  const response = await fetch(`/api/metricvalues?id=${metricTypeId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch metric values data");
  }
  return response.json();
}

export function useMetricValues(metricTypeId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.metricValues(metricTypeId!),
    queryFn: () => fetchMetricValues(metricTypeId!),
    enabled: metricTypeId !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const data = useMemo(() => query.data ?? [], [query.data]);

  // Compute min and max values
  const { min, max } = useMemo(() => {
    if (data.length === 0) {
      return { min: null, max: null };
    }
    const values = data.map((d) => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [data]);

  // Create a map of org_unit -> value for quick lookup
  const valuesByOrgUnit = useMemo(() => {
    return data.reduce<Record<number, number>>((acc, item) => {
      acc[item.org_unit] = item.value;
      return acc;
    }, {});
  }, [data]);

  return {
    data,
    valuesByOrgUnit,
    min,
    max,
    isLoading: query.isLoading,
    error: query.error,
  };
}
