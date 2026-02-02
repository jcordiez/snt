"use client";

import { useMemo } from "react";
import type { MultiPolygon, Polygon } from "geojson";
import type { DistrictProperties, Province } from "@/data/districts";
import type { InterventionCategory } from "@/types/intervention";
import type { SavedRule } from "@/types/rule";
import { InterventionTable } from "./intervention-table";

interface ListViewProps {
  districts: GeoJSON.FeatureCollection<MultiPolygon | Polygon, DistrictProperties> | null;
  selectedProvince: Province | null;
  interventionCategories: InterventionCategory[];
  rules: SavedRule[];
  metricValuesByType: Record<number, Record<string, number>>;
}

export function ListView({
  districts,
  selectedProvince,
  interventionCategories,
  rules,
  metricValuesByType,
}: ListViewProps) {
  // Filter districts by selected province
  const filteredDistricts = useMemo(() => {
    if (!districts?.features) return [];

    return districts.features
      .filter((feature) =>
        selectedProvince
          ? feature.properties.regionId === selectedProvince.id
          : true
      )
      .map((feature) => feature.properties)
      .sort((a, b) => a.districtName.localeCompare(b.districtName));
  }, [districts, selectedProvince]);

  if (!districts?.features.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading districts...
      </div>
    );
  }

  if (filteredDistricts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No districts found for selected province
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 overflow-y-auto">
        <InterventionTable
          districts={filteredDistricts}
          interventionCategories={interventionCategories}
          rules={rules}
          metricValuesByType={metricValuesByType}
        />
      </div>
    </div>
  );
}
