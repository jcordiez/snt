"use client";

import { memo, useEffect, useRef, useMemo } from "react";
import type MapLibreGL from "maplibre-gl";
import maplibregl from "maplibre-gl";
import { Map as MapComponent, useMap } from "@/components/ui/map";
import {
  getColorForInterventionMix,
  PREDEFINED_INTERVENTION_COLORS,
} from "@/lib/intervention-colors";
import type { DistrictProperties, Province } from "@/data/districts";
import type { PlanDefinition } from "@/data/predefined-plans";
import { usePlanDistricts } from "./use-plan-districts";

const SOURCE_ID = "miniature-districts";
const FILL_LAYER_ID = "miniature-fills";
const BORDER_LAYER_ID = "miniature-borders";

/**
 * Builds a MapLibre color expression from districts data.
 * Priority: ruleColor (if set) > interventionMixLabel-based color.
 */
function buildColorExpression(
  districtsData: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  >
): MapLibreGL.ExpressionSpecification | string {
  const colorMap = new Map<string, string>();
  for (const feature of districtsData.features) {
    const mixLabel = feature.properties.interventionMixLabel;
    if (mixLabel && !colorMap.has(mixLabel)) {
      colorMap.set(mixLabel, getColorForInterventionMix(mixLabel));
    }
  }

  const matchCases: string[] = [];
  colorMap.forEach((color: string, label: string) => {
    matchCases.push(label, color);
  });

  const fallbackExpression =
    matchCases.length > 0
      ? ["match", ["get", "interventionMixLabel"], ...matchCases, PREDEFINED_INTERVENTION_COLORS["CM"]]
      : PREDEFINED_INTERVENTION_COLORS["CM"];

  return [
    "case",
    ["all", ["has", "ruleColor"], ["!=", ["get", "ruleColor"], ""]],
    ["get", "ruleColor"],
    fallbackExpression,
  ] as unknown as MapLibreGL.ExpressionSpecification;
}

/**
 * Inner component that renders district layers on the miniature map.
 * Must be a child of <Map> to access the map context.
 */
function MiniatureDistrictLayer({
  districts,
}: {
  districts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  >;
}) {
  const { map, isLoaded } = useMap();
  const layersAdded = useRef(false);

  // Add source and layers on mount
  useEffect(() => {
    if (!isLoaded || !map) return;
    if (map.getSource(SOURCE_ID)) {
      layersAdded.current = true;
      return;
    }

    const colorExpression = buildColorExpression(districts);

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: districts,
    });

    map.addLayer({
      id: FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": colorExpression,
        "fill-opacity": 0.7,
      },
    });

    map.addLayer({
      id: BORDER_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#ffffff",
        "line-width": 0.5,
      },
    });

    layersAdded.current = true;
  }, [isLoaded, map, districts]);

  // Update data and colors when districts change
  useEffect(() => {
    if (!isLoaded || !map || !layersAdded.current) return;

    const source = map.getSource(SOURCE_ID) as MapLibreGL.GeoJSONSource | undefined;
    if (source) {
      source.setData(districts);
    }

    const colorExpression = buildColorExpression(districts);
    if (map.getLayer(FILL_LAYER_ID)) {
      map.setPaintProperty(FILL_LAYER_ID, "fill-color", colorExpression);
    }
  }, [isLoaded, map, districts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      try {
        if (map.getLayer(BORDER_LAYER_ID)) map.removeLayer(BORDER_LAYER_ID);
        if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        layersAdded.current = false;
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [map]);

  return null;
}

/**
 * Component that handles auto-zoom for the miniature map based on selected province.
 * Must be a child of <Map> to access the map context.
 */
function AutoZoom({
  districts,
  selectedProvince,
}: {
  districts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  >;
  selectedProvince?: Province | null;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) return;

    // If no province selected, reset to default view
    if (!selectedProvince || districts.features.length === 0) {
      map.setCenter([23.6, -2.9]);
      map.setZoom(3.2);
      return;
    }

    // Calculate bounds from filtered districts
    const bounds = new maplibregl.LngLatBounds();

    for (const feature of districts.features) {
      const geometry = feature.geometry;

      if (geometry.type === "Polygon") {
        geometry.coordinates[0].forEach((coord) => {
          bounds.extend(coord as [number, number]);
        });
      } else if (geometry.type === "MultiPolygon") {
        geometry.coordinates.forEach((polygon) => {
          polygon[0].forEach((coord) => {
            bounds.extend(coord as [number, number]);
          });
        });
      }
    }

    // Fit to bounds with padding
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 6,
        maxZoom: 6,
        duration: 300,
      });
    }
  }, [map, isLoaded, selectedProvince, districts]);

  return null;
}

interface MiniatureMapProps {
  plan: PlanDefinition;
  selectedProvince?: Province | null;
}

export const MiniatureMap = memo(function MiniatureMap({
  plan,
  selectedProvince,
}: MiniatureMapProps) {
  const { planDistricts } = usePlanDistricts(plan);

  // Filter districts based on selected province
  const filteredDistricts = useMemo(() => {
    if (!planDistricts || !selectedProvince) return planDistricts;

    return {
      ...planDistricts,
      features: planDistricts.features.filter(
        (f) => f.properties.regionId === selectedProvince.id
      ),
    };
  }, [planDistricts, selectedProvince]);

  if (!filteredDistricts) {
    return (
      <div className="h-full bg-muted flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full">
      <MapComponent
        center={[23.6, -2.9]}
        zoom={3.2}
        interactive={false}
        attributionControl={false}
      >
        <MiniatureDistrictLayer districts={filteredDistricts} />
        <AutoZoom
          districts={filteredDistricts}
          selectedProvince={selectedProvince}
        />
      </MapComponent>
    </div>
  );
});
