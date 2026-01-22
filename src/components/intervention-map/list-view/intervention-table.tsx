"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import type { DistrictProperties } from "@/data/districts";
import type { InterventionCategory, Intervention } from "@/types/intervention";
import { cn } from "@/lib/utils";

interface InterventionTableProps {
  districts: DistrictProperties[];
  interventionCategories: InterventionCategory[];
}

interface FlattenedIntervention {
  categoryId: number;
  categoryName: string;
  intervention: Intervention;
}

export function InterventionTable({
  districts,
  interventionCategories,
}: InterventionTableProps) {
  // Flatten all interventions with their category info for column rendering
  const flattenedInterventions = useMemo(() => {
    const result: FlattenedIntervention[] = [];

    // Sort categories by ID for consistent ordering
    const sortedCategories = [...interventionCategories].sort((a, b) => a.id - b.id);

    for (const category of sortedCategories) {
      // Sort interventions within category by name
      const sortedInterventions = [...category.interventions].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      for (const intervention of sortedInterventions) {
        result.push({
          categoryId: category.id,
          categoryName: category.name,
          intervention,
        });
      }
    }

    return result;
  }, [interventionCategories]);

  // Group interventions by category for header spanning
  const categoryGroups = useMemo(() => {
    const groups: Array<{ categoryId: number; categoryName: string; count: number }> = [];
    let currentCategory: number | null = null;
    let count = 0;

    for (const item of flattenedInterventions) {
      if (item.categoryId !== currentCategory) {
        if (currentCategory !== null) {
          const prevItem = flattenedInterventions.find(
            (i) => i.categoryId === currentCategory
          );
          groups.push({
            categoryId: currentCategory,
            categoryName: prevItem?.categoryName ?? "",
            count,
          });
        }
        currentCategory = item.categoryId;
        count = 1;
      } else {
        count++;
      }
    }

    // Push the last group
    if (currentCategory !== null) {
      const lastItem = flattenedInterventions.find(
        (i) => i.categoryId === currentCategory
      );
      groups.push({
        categoryId: currentCategory,
        categoryName: lastItem?.categoryName ?? "",
        count,
      });
    }

    return groups;
  }, [flattenedInterventions]);

  // Check if a district has a specific intervention assigned
  const hasIntervention = (
    district: DistrictProperties,
    categoryId: number,
    interventionId: number
  ): boolean => {
    const assignments = district.interventionCategoryAssignments;
    if (!assignments) return false;
    return assignments[String(categoryId)] === interventionId;
  };

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse text-sm">
        {/* Category header row */}
        <thead className="sticky top-0 z-20 bg-background">
          <tr className="border-b">
            <th
              rowSpan={2}
              className="sticky left-0 z-30 bg-gray-50 border-r px-4 py-2 text-left font-semibold min-w-[200px]"
            >
              District
            </th>
            {categoryGroups.map((group) => (
              <th
                key={group.categoryId}
                colSpan={group.count}
                className="border-b border-r bg-gray-50 px-2 py-2 text-center font-semibold text-xs text-muted-foreground"
              >
                {group.categoryName}
              </th>
            ))}
          </tr>
          {/* Intervention header row */}
          <tr className="border-b">
            {flattenedInterventions.map((item) => (
              <th
                key={`${item.categoryId}-${item.intervention.id}`}
                className="border-r bg-gray-50 px-2 py-2 text-center font-medium text-xs min-w-[80px]"
                title={item.intervention.name}
              >
                {item.intervention.short_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {districts.map((district, index) => (
            <tr
              key={district.districtId}
              className={cn(
                "border-b hover:bg-muted/50 transition-colors",
                index % 2 === 0 ? "bg-background" : "bg-muted/20"
              )}
            >
              <td className="sticky left-0 z-10 bg-inherit border-r px-4 py-2 font-medium">
                {district.districtName}
              </td>
              {flattenedInterventions.map((item) => (
                <td
                  key={`${district.districtId}-${item.categoryId}-${item.intervention.id}`}
                  className="border-r px-2 py-2 text-center"
                >
                  {hasIntervention(
                    district,
                    item.categoryId,
                    item.intervention.id
                  ) && (
                    <Check
                      className="inline-block h-4 w-4 text-green-600"
                      aria-label="Assigned"
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
