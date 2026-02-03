"use client";

import { useMemo, useState } from "react";
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
 * Groups by combination of interventionMixLabel AND ruleColor to ensure legend
 * matches the actual colors displayed on the map.
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

  // Group by combination of label + color to handle same mix with different rule colors
  // Key format: "label|color"
  const mixData = new Map<string, { label: string; color: string; districtIds: string[] }>();

  for (const feature of districts.features) {
    const mixLabel = feature.properties.interventionMixLabel;
    const districtId = feature.properties.districtId;
    const ruleColor = feature.properties.ruleColor;

    if (mixLabel && districtId) {
      // Determine the actual color that will be displayed on the map
      const displayColor = ruleColor || getColorForInterventionMix(mixLabel);
      const key = `${mixLabel}|${displayColor}`;

      const existing = mixData.get(key) ?? { label: mixLabel, color: displayColor, districtIds: [] };
      existing.districtIds.push(districtId);
      mixData.set(key, existing);
    }
  }

  // If no intervention mixes assigned yet, show a default message
  if (mixData.size === 0) {
    return [{ color: "#e5e7eb", label: "No interventions assigned", districtCount: 0, districtIds: [] }];
  }

  // Convert to array and sort
  const items = Array.from(mixData.values());

  // Sort: by number of interventions (+ count), then alphabetically by label, then by color
  items.sort((a, b) => {
    // "None" should always be last
    if (a.label === "None") return 1;
    if (b.label === "None") return -1;
    // Sort by number of interventions (+ count)
    const aCount = (a.label.match(/\+/g) || []).length;
    const bCount = (b.label.match(/\+/g) || []).length;
    if (aCount !== bCount) return aCount - bCount;
    // Then alphabetically by label
    const labelCompare = a.label.localeCompare(b.label);
    if (labelCompare !== 0) return labelCompare;
    // Finally by color for same labels
    return a.color.localeCompare(b.color);
  });

  return items.map((data) => ({
    color: data.color,
    label: data.label,
    districtCount: data.districtIds.length,
    districtIds: data.districtIds,
  }));
}

export function MapLegend({ districts, onSelectMix }: MapLegendProps) {
  const [collapsed, setCollapsed] = useState(false);
  const legendItems = useMemo(
    () => computeLegendItems(districts ?? null),
    [districts]
  );

  // Labels that should not show a "Select" button
  const nonSelectableLabels = ["No data", "No interventions assigned"];

  return (
    <div className="absolute bottom-3 left-3 z-10 bg-[#1F2B3D]/75 backdrop-blur-sm rounded-lg shadow-md px-3 py-2">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="text-xs font-semibold text-white">
          Intervention Mix
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-white/70 hover:text-white text-xs leading-none px-1"
          aria-label={collapsed ? "Show legend" : "Hide legend"}
        >
          {collapsed ? "+" : "\u2212"}
        </button>
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-1">
          {legendItems.map((item) => {
            const isSelectable = !nonSelectableLabels.includes(item.label) && item.districtIds.length > 0;
            return (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0 border border-white/30"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-white flex-1">
                  {item.label} ({item.districtCount})
                </span>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
