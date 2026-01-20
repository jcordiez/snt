"use client";

import { useEffect, useRef, useMemo } from "react";
import maplibregl from "maplibre-gl";
import type MapLibreGL from "maplibre-gl";
import { useMap } from "@/components/ui/map";
import { getColorForInterventionMix, PREDEFINED_INTERVENTION_COLORS } from "@/lib/intervention-colors";
import type { DistrictProperties } from "@/data/districts";

const SOURCE_ID = "districts";
// Active layer IDs (districts within selected province)
const ACTIVE_FILL_LAYER_ID = "district-fills-active";
const ACTIVE_BORDER_LAYER_ID = "district-borders-active";
// Inactive layer IDs (districts outside selected province)
const INACTIVE_FILL_LAYER_ID = "district-fills-inactive";
const INACTIVE_BORDER_LAYER_ID = "district-borders-inactive";
// Highlight layer ID (for intervention wizard selection)
const HIGHLIGHT_BORDER_LAYER_ID = "district-borders-highlight";

interface DistrictLayerProps {
  selectedProvinceId?: string | null;
  highlightedDistrictIds?: string[];
  districts?: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null;
}

// Helper function to build color expression from districts data
function buildColorExpression(
  districtsData: GeoJSON.FeatureCollection<GeoJSON.MultiPolygon | GeoJSON.Polygon, DistrictProperties> | null | undefined
): MapLibreGL.ExpressionSpecification | string {
  if (!districtsData?.features) {
    return PREDEFINED_INTERVENTION_COLORS["CM"];
  }

  // Build color map from districts
  const colorMap = new Map<string, string>();
  for (const feature of districtsData.features) {
    const mixLabel = feature.properties.interventionMixLabel;
    if (mixLabel && !colorMap.has(mixLabel)) {
      colorMap.set(mixLabel, getColorForInterventionMix(mixLabel));
    }
  }

  // Build match cases: [label1, color1, label2, color2, ...]
  const matchCases: string[] = [];
  colorMap.forEach((color, label) => {
    matchCases.push(label, color);
  });

  // Return match expression or default
  if (matchCases.length > 0) {
    return [
      "match",
      ["get", "interventionMixLabel"],
      ...matchCases,
      PREDEFINED_INTERVENTION_COLORS["CM"], // Default to CM color
    ] as unknown as MapLibreGL.ExpressionSpecification;
  }

  return PREDEFINED_INTERVENTION_COLORS["CM"];
}

export function DistrictLayer({ selectedProvinceId, highlightedDistrictIds = [], districts }: DistrictLayerProps) {
  const { map, isLoaded } = useMap();
  const layersAdded = useRef(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // Compute unique intervention mix labels and their colors for dynamic styling
  const mixColorMap = useMemo(() => {
    if (!districts?.features) return new Map<string, string>();

    const colorMap = new Map<string, string>();
    for (const feature of districts.features) {
      const mixLabel = feature.properties.interventionMixLabel;
      if (mixLabel && !colorMap.has(mixLabel)) {
        colorMap.set(mixLabel, getColorForInterventionMix(mixLabel));
      }
    }
    return colorMap;
  }, [districts]);

  useEffect(() => {
    // Only create layers once when map is ready and we have districts data
    if (!isLoaded || !map || !districts || layersAdded.current)
      return;

    // Compute the initial color expression from districts data
    // This ensures colors are applied immediately when layers are added
    const initialColorExpression = buildColorExpression(districts);

    // Add GeoJSON source with ALL districts (no filtering at source level)
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: districts,
    });

    // Add INACTIVE fill layer (grayed out, rendered first/below)
    map.addLayer({
      id: INACTIVE_FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": "#d1d5db", // gray-300
        "fill-opacity": 0.3,
        "fill-opacity-transition": { duration: 300 },
      },
    });

    // Add INACTIVE border layer
    map.addLayer({
      id: INACTIVE_BORDER_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#9ca3af", // gray-400
        "line-opacity": 0.5,
        "line-width": 0.5,
      },
    });

    // Add ACTIVE fill layer with data-driven styling (rendered on top)
    // Color expression is computed immediately from districts data for proper synchronization
    map.addLayer({
      id: ACTIVE_FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": initialColorExpression,
        "fill-opacity": 0.7,
        "fill-opacity-transition": { duration: 300 },
      },
    });

    // Add ACTIVE border layer
    map.addLayer({
      id: ACTIVE_BORDER_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#ffffff",
        "line-width": 1,
      },
    });

    // Add HIGHLIGHT border layer (for intervention wizard selection)
    map.addLayer({
      id: HIGHLIGHT_BORDER_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#3b82f6", // blue-500
        "line-width": 3,
      },
      filter: ["in", ["get", "districtId"], ["literal", []]], // Initially empty
    });

    layersAdded.current = true;

    return () => {
      try {
        if (map.getLayer(HIGHLIGHT_BORDER_LAYER_ID)) map.removeLayer(HIGHLIGHT_BORDER_LAYER_ID);
        if (map.getLayer(ACTIVE_BORDER_LAYER_ID)) map.removeLayer(ACTIVE_BORDER_LAYER_ID);
        if (map.getLayer(ACTIVE_FILL_LAYER_ID)) map.removeLayer(ACTIVE_FILL_LAYER_ID);
        if (map.getLayer(INACTIVE_BORDER_LAYER_ID)) map.removeLayer(INACTIVE_BORDER_LAYER_ID);
        if (map.getLayer(INACTIVE_FILL_LAYER_ID)) map.removeLayer(INACTIVE_FILL_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        layersAdded.current = false;
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [isLoaded, map]);

  // Update layer filters when selectedProvinceId changes
  useEffect(() => {
    if (!isLoaded || !map || !layersAdded.current) return;

    if (selectedProvinceId) {
      // Filter active layers to show only districts in selected province
      const activeFilter: MapLibreGL.FilterSpecification = [
        "==",
        ["get", "regionId"],
        selectedProvinceId,
      ];
      // Filter inactive layers to show districts NOT in selected province
      const inactiveFilter: MapLibreGL.FilterSpecification = [
        "!=",
        ["get", "regionId"],
        selectedProvinceId,
      ];

      map.setFilter(ACTIVE_FILL_LAYER_ID, activeFilter);
      map.setFilter(ACTIVE_BORDER_LAYER_ID, activeFilter);
      map.setFilter(INACTIVE_FILL_LAYER_ID, inactiveFilter);
      map.setFilter(INACTIVE_BORDER_LAYER_ID, inactiveFilter);
    } else {
      // No province selected - show all districts as active, hide inactive layers
      map.setFilter(ACTIVE_FILL_LAYER_ID, null);
      map.setFilter(ACTIVE_BORDER_LAYER_ID, null);
      // Hide inactive layers by using an impossible filter
      map.setFilter(INACTIVE_FILL_LAYER_ID, ["==", ["get", "regionId"], "__none__"]);
      map.setFilter(INACTIVE_BORDER_LAYER_ID, ["==", ["get", "regionId"], "__none__"]);
    }
  }, [isLoaded, map, selectedProvinceId]);

  // Update highlight layer filter when highlightedDistrictIds changes
  useEffect(() => {
    if (!isLoaded || !map || !layersAdded.current) return;

    if (highlightedDistrictIds.length > 0) {
      map.setFilter(HIGHLIGHT_BORDER_LAYER_ID, [
        "in",
        ["get", "districtId"],
        ["literal", highlightedDistrictIds],
      ]);
    } else {
      // Hide highlight layer when no districts selected
      map.setFilter(HIGHLIGHT_BORDER_LAYER_ID, [
        "in",
        ["get", "districtId"],
        ["literal", []],
      ]);
    }
  }, [isLoaded, map, highlightedDistrictIds]);

  // Update fill colors when intervention mixes change
  useEffect(() => {
    if (!isLoaded || !map || !layersAdded.current) return;

    // Build a dynamic match expression for intervention mix colors
    // All districts have interventionMixLabel set (CM by default)
    // Build match cases: [label1, color1, label2, color2, ...]
    const matchCases: string[] = [];
    mixColorMap.forEach((color, label) => {
      matchCases.push(label, color);
    });

    // Use match expression based on interventionMixLabel
    // Default to CM color (darker gray) for any unknown mixes
    // Always set the color expression, even if mixColorMap is empty (use default)
    const colorExpression = matchCases.length > 0
      ? [
          "match",
          ["get", "interventionMixLabel"],
          ...matchCases,
          PREDEFINED_INTERVENTION_COLORS["CM"], // Default to CM color
        ] as unknown as MapLibreGL.ExpressionSpecification
      : PREDEFINED_INTERVENTION_COLORS["CM"];

    map.setPaintProperty(ACTIVE_FILL_LAYER_ID, "fill-color", colorExpression);

    // Update the source data when districts changes
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (source && districts) {
      source.setData(districts);
    }
  }, [isLoaded, map, mixColorMap, districts]);

  // Tooltip on hover (only for active layer - inactive districts have no interaction)
  useEffect(() => {
    if (!isLoaded || !map) return;

    // Create popup instance
    if (!popupRef.current) {
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
      });
    }

    const popup = popupRef.current;

    const handleMouseMove = (e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] }) => {
      if (!e.features?.length) return;

      const props = e.features[0].properties;
      const mixLabel = props.interventionMixLabel || "CM";

      // Split the intervention mix label (e.g., "CM + IPTp + Dual AI") into individual interventions
      const interventions = mixLabel.split(" + ");
      const interventionList = interventions
        .map((intervention: string) => `• ${intervention}`)
        .join("<br>");

      map.getCanvas().style.cursor = "pointer";

      popup
        .setLngLat(e.lngLat)
        .setHTML(`
          <strong>${props.districtName}</strong>
          <div style="margin-top: 4px; font-size: 12px; color: #666;">Interventions:</div>
          <div style="margin-top: 2px; font-size: 12px;">${interventionList}</div>
        `)
        .addTo(map);
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    };

    // Only attach hover handlers to ACTIVE fill layer (not inactive)
    map.on("mousemove", ACTIVE_FILL_LAYER_ID, handleMouseMove);
    map.on("mouseleave", ACTIVE_FILL_LAYER_ID, handleMouseLeave);

    return () => {
      map.off("mousemove", ACTIVE_FILL_LAYER_ID, handleMouseMove);
      map.off("mouseleave", ACTIVE_FILL_LAYER_ID, handleMouseLeave);
      popup.remove();
    };
  }, [isLoaded, map]);

  return null;
}
