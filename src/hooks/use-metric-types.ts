"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { MetricType } from "@/types/intervention";

async function fetchMetricTypes(): Promise<MetricType[]> {
  const response = await fetch("/api/metric-types");
  if (!response.ok) {
    throw new Error("Failed to fetch metric types data");
  }
  return response.json();
}

export function useMetricTypes() {
  const query = useQuery({
    queryKey: queryKeys.metricTypes,
    queryFn: fetchMetricTypes,
    staleTime: Infinity, // Static metadata
    gcTime: Infinity,    // Never garbage collect static metadata
  });

  // Local state for client-side added metrics
  const [localMetrics, setLocalMetrics] = useState<MetricType[]>([]);

  // Combine fetched data with locally added metrics
  const data = useMemo(() => {
    return [...(query.data ?? []), ...localMetrics];
  }, [query.data, localMetrics]);

  // Group metric types by category for dropdown display
  const groupedByCategory = useMemo(() => {
    return data.reduce<Record<string, MetricType[]>>(
      (acc, metric) => {
        const category = metric.category || "Other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(metric);
        return acc;
      },
      {}
    );
  }, [data]);

  const addMetric = useCallback((newMetric: Omit<MetricType, 'id' | 'created_at' | 'updated_at'>) => {
    const metric: MetricType = {
      ...newMetric,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocalMetrics(prev => [...prev, metric]);
    return metric;
  }, []);

  return {
    data,
    groupedByCategory,
    isLoading: query.isLoading,
    error: query.error,
    addMetric,
  };
}
