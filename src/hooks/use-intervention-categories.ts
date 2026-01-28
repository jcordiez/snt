"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { InterventionCategory } from "@/types/intervention";

async function fetchInterventionCategories(): Promise<InterventionCategory[]> {
  const response = await fetch("/api/intervention-categories");
  if (!response.ok) {
    throw new Error("Failed to fetch intervention categories data");
  }
  return response.json();
}

export function useInterventionCategories() {
  const query = useQuery({
    queryKey: queryKeys.interventionCategories,
    queryFn: fetchInterventionCategories,
    staleTime: Infinity, // Static reference data
    gcTime: Infinity,    // Never garbage collect static reference data
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
