"use client";

import { useMemo } from "react";
import type { DistrictProperties } from "@/data/districts";
import { getColorForInterventionMix } from "@/lib/intervention-colors";
import { Button } from "@/components/ui/button";

interface LegendItem {
  color: string;
  label: string;
  districtCount: number;
  districtIds: string[];
}

interface MapLegendProps {
  districts?: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null;
  onSelectMix?: (mixLabel: string, districtIds: string[]) => void;
}

/**
 * Extracts unique intervention mixes from district data and generates legend items.
 */
function computeLegendItems(
  districts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null
): LegendItem[] {
  if (!districts?.features?.length) {
    return [{ color: "#e5e7eb", label: "No data", districtCount: 0, districtIds: [] }];
  }

  // Collect unique intervention mix labels and district IDs per mix
  const mixData = new Map<string, string[]>();

  for (const feature of districts.features) {
    const mixLabel = feature.properties.interventionMixLabel;
    const districtId = feature.properties.districtId;
    if (mixLabel && districtId) {
      const ids = mixData.get(mixLabel) ?? [];
      ids.push(districtId);
      mixData.set(mixLabel, ids);
    }
  }

  // If no intervention mixes assigned yet, show a default message
  if (mixData.size === 0) {
    return [{ color: "#e5e7eb", label: "No interventions assigned", districtCount: 0, districtIds: [] }];
  }

  // Sort labels for consistent ordering (shorter labels first, then alphabetically)
  const sortedLabels = Array.from(mixData.keys()).sort((a, b) => {
    // "None" should always be last
    if (a === "None") return 1;
    if (b === "None") return -1;
    // Sort by number of interventions (+ count), then alphabetically
    const aCount = (a.match(/\+/g) || []).length;
    const bCount = (b.match(/\+/g) || []).length;
    if (aCount !== bCount) return aCount - bCount;
    return a.localeCompare(b);
  });

  return sortedLabels.map((label) => {
    const districtIds = mixData.get(label) ?? [];
    return {
      color: getColorForInterventionMix(label),
      label,
      districtCount: districtIds.length,
      districtIds,
    };
  });
}

export function MapLegend({ districts, onSelectMix }: MapLegendProps) {
  const legendItems = useMemo(
    () => computeLegendItems(districts ?? null),
    [districts]
  );

  // Labels that should not show a "Select" button
  const nonSelectableLabels = ["No data", "No interventions assigned"];

  return (
    <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 border border-gray-200">
      <div className="text-xs font-semibold text-gray-700 mb-1.5">
        Intervention Mix
      </div>
      <div className="flex flex-col gap-1">
        {legendItems.map((item) => {
          const isSelectable = !nonSelectableLabels.includes(item.label) && item.districtIds.length > 0;
          return (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0 border border-gray-300"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600 flex-1">
                {item.label} ({item.districtCount})
              </span>
              {isSelectable && onSelectMix && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-xs"
                  onClick={() => onSelectMix(item.label, item.districtIds)}
                >
                  Select
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
