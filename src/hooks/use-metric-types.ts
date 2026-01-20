"use client";

import { useState, useEffect } from "react";
import type { MetricType } from "@/types/intervention";

export function useMetricTypes() {
  const [data, setData] = useState<MetricType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/metric-types");
        if (!response.ok) {
          throw new Error("Failed to fetch metric types data");
        }
        const metricTypes: MetricType[] = await response.json();
        setData(metricTypes);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Group metric types by category for dropdown display
  const groupedByCategory = data.reduce<Record<string, MetricType[]>>(
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

  return { data, groupedByCategory, isLoading, error };
}
