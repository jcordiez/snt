"use client";

import { useMemo } from "react";
import type { DistrictProperties } from "@/data/districts";
import { getColorForInterventionMix } from "@/lib/intervention-colors";

interface LegendItem {
  color: string;
  label: string;
}

interface MapLegendProps {
  districts?: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null;
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
    return [{ color: "#e5e7eb", label: "No data" }];
  }

  // Collect unique intervention mix labels
  const mixLabels = new Set<string>();

  for (const feature of districts.features) {
    const { interventionMix } = feature.properties;
    if (interventionMix?.displayLabel) {
      mixLabels.add(interventionMix.displayLabel);
    }
  }

  // If no intervention mixes assigned yet, show a default message
  if (mixLabels.size === 0) {
    return [{ color: "#e5e7eb", label: "No interventions assigned" }];
  }

  // Sort labels for consistent ordering (shorter labels first, then alphabetically)
  const sortedLabels = Array.from(mixLabels).sort((a, b) => {
    // "None" should always be last
    if (a === "None") return 1;
    if (b === "None") return -1;
    // Sort by number of interventions (+ count), then alphabetically
    const aCount = (a.match(/\+/g) || []).length;
    const bCount = (b.match(/\+/g) || []).length;
    if (aCount !== bCount) return aCount - bCount;
    return a.localeCompare(b);
  });

  return sortedLabels.map((label) => ({
    color: getColorForInterventionMix(label),
    label,
  }));
}

export function MapLegend({ districts }: MapLegendProps) {
  const legendItems = useMemo(
    () => computeLegendItems(districts ?? null),
    [districts]
  );

  return (
    <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 border border-gray-200">
      <div className="text-xs font-semibold text-gray-700 mb-1.5">
        Intervention Mix
      </div>
      <div className="flex flex-col gap-1">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0 border border-gray-300"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
