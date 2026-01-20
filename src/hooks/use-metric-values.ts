"use client";

import { useState, useEffect, useMemo } from "react";
import type { MetricValue } from "@/types/intervention";

export function useMetricValues(metricTypeId: number | null) {
  const [data, setData] = useState<MetricValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (metricTypeId === null) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/metricvalues?id=${metricTypeId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch metric values data");
        }
        const metricValues: MetricValue[] = await response.json();
        setData(metricValues);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [metricTypeId]);

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

  return { data, valuesByOrgUnit, min, max, isLoading, error };
}
