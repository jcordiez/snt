"use client";

import { useMemo, useState } from "react";
import { CircleCheck } from "lucide-react";
import type { DistrictProperties } from "@/data/districts";
import type { InterventionCategory, Intervention } from "@/types/intervention";
import type { SavedRule } from "@/types/rule";
import { getLastMatchingRuleColor } from "@/hooks/use-district-rules";

interface InterventionTableProps {
  districts: DistrictProperties[];
  interventionCategories: InterventionCategory[];
  rules: SavedRule[];
  metricValuesByType: Record<number, Record<string, number>>;
}

interface FlattenedIntervention {
  categoryId: number;
  categoryName: string;
  intervention: Intervention;
}

export function InterventionTable({
  districts,
  interventionCategories,
  rules,
  metricValuesByType,
}: InterventionTableProps) {
  // Track which row is currently being hovered
  const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(null);
  // Track which row is currently selected
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);

  // Transform metricValuesByType from Record<metricId, Record<districtId, value>>
  // to Record<districtId, Record<metricId, value>> for getLastMatchingRuleColor
  const metricValuesByDistrict = useMemo(() => {
    const result: Record<string, Record<number, number>> = {};

    for (const [metricIdStr, districtValues] of Object.entries(metricValuesByType)) {
      const metricId = Number(metricIdStr);
      for (const [districtId, value] of Object.entries(districtValues)) {
        if (!result[districtId]) {
          result[districtId] = {};
        }
        result[districtId][metricId] = value;
      }
    }

    return result;
  }, [metricValuesByType]);

  // Helper to convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
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
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse text-sm">
        {/* Category header row */}
        <thead className="sticky top-0 z-20 bg-white">
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
          {districts.map((district) => {
            const ruleColor = getLastMatchingRuleColor(
              district.districtId,
              rules,
              metricValuesByDistrict
            );
            const isHovered = hoveredDistrictId === district.districtId;
            const isSelected = selectedDistrictId === district.districtId;
            // Selected: 50%, Hovered (not selected): 45%, Default: 30%
            const opacity = isSelected ? 0.3 : (isHovered ? 0.2 : 0.1);
            // Always set background-color (even transparent) so transitions work
            // when rule colors change or rules are deleted
            const rowStyle = {
              backgroundColor: ruleColor
                ? hexToRgba(ruleColor, opacity)
                : 'transparent',
              transition: "background-color 250ms",
            };

            return (
            <tr
              key={district.districtId}
              className="border-b cursor-pointer"
              style={rowStyle}
              onMouseEnter={() => setHoveredDistrictId(district.districtId)}
              onMouseLeave={() => setHoveredDistrictId(null)}
              onClick={() => setSelectedDistrictId(
                selectedDistrictId === district.districtId ? null : district.districtId
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
                    <CircleCheck
                      className="inline-block h-4 w-4 text-white fill-black"
                      aria-label="Assigned"
                    />
                  )}
                </td>
              ))}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
