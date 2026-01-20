"use client";

import { useState, useEffect } from "react";
import type { InterventionCategory } from "@/types/intervention";

export function useInterventionCategories() {
  const [data, setData] = useState<InterventionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/intervention-categories");
        if (!response.ok) {
          throw new Error("Failed to fetch intervention categories data");
        }
        const categories: InterventionCategory[] = await response.json();
        setData(categories);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, isLoading, error };
}
