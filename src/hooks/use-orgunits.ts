"use client";

import { useState, useEffect } from "react";
import type { DistrictProperties, InterventionStatus, Province, OrgUnitWithGeoJSON } from "@/data/districts";
import { extractProvinces } from "@/data/districts";

interface OrgUnit {
  id: number;
  name: string;
  short_name: string;
  parent_id: number;
  parent_name: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  has_geo_json: boolean;
  org_unit_type: string;
  org_unit_type_id: number;
  org_unit_type_depth: number;
  source_id: number;
  source_name: string;
  geo_json: GeoJSON.FeatureCollection | null;
}

const MOCK_INTERVENTIONS = {
  completed: ["Vaccination Campaign", "Health Education", "Maternal Health", "Nutrition Program"],
  ongoing: ["Malaria Prevention", "Nutrition Program", "Health Education"],
  planned: ["Water Sanitation", "Maternal Health"],
  none: [] as string[],
};

function getRandomInterventionStatus(): InterventionStatus {
  const statuses: InterventionStatus[] = ["completed", "ongoing", "planned", "none"];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function getInterventionsForStatus(status: InterventionStatus): string[] {
  const available = MOCK_INTERVENTIONS[status];
  if (available.length === 0) return [];

  // Randomly select a subset of interventions
  const count = Math.floor(Math.random() * available.length) + 1;
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function transformOrgUnitsToGeoJSON(
  orgUnits: OrgUnit[]
): GeoJSON.FeatureCollection<GeoJSON.MultiPolygon | GeoJSON.Polygon, DistrictProperties> {
  const features: GeoJSON.Feature<GeoJSON.MultiPolygon | GeoJSON.Polygon, DistrictProperties>[] = [];

  for (const unit of orgUnits) {
    if (!unit.has_geo_json || !unit.geo_json?.features?.length) continue;

    const geometry = unit.geo_json.features[0]?.geometry;
    if (!geometry) continue;

    const status = getRandomInterventionStatus();
    const interventions = getInterventionsForStatus(status);

    features.push({
      type: "Feature",
      properties: {
        districtId: String(unit.id),
        districtName: unit.name,
        regionId: String(unit.parent_id),
        regionName: unit.parent_name,
        interventionStatus: status,
        interventionCount: interventions.length,
        interventions,
      },
      geometry: geometry as GeoJSON.MultiPolygon | GeoJSON.Polygon,
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

export function useOrgUnits() {
  const [data, setData] = useState<GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/orgunits");
        if (!response.ok) {
          throw new Error("Failed to fetch org units data");
        }
        const orgUnits: OrgUnit[] = await response.json();
        const geoJSON = transformOrgUnitsToGeoJSON(orgUnits);
        setData(geoJSON);

        // Extract provinces from org units
        const orgUnitsWithGeoJSON: OrgUnitWithGeoJSON[] = orgUnits.map((unit) => ({
          id: unit.id,
          name: unit.name,
          parent_id: unit.parent_id,
          parent_name: unit.parent_name,
          geo_json: unit.geo_json,
        }));
        const extractedProvinces = extractProvinces(orgUnitsWithGeoJSON);
        setProvinces(extractedProvinces);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, provinces, isLoading, error };
}
