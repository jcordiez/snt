"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type MapLibreGL from "maplibre-gl";
import { useMap } from "@/components/ui/map";
import { interventionColors } from "@/data/districts";
import { useOrgUnits } from "@/hooks/use-orgunits";

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
}

export function DistrictLayer({ selectedProvinceId, highlightedDistrictIds = [] }: DistrictLayerProps) {
  const { map, isLoaded } = useMap();
  const { data: orgUnitsData, isLoading } = useOrgUnits();
  const layersAdded = useRef(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    if (!isLoaded || !map || isLoading || !orgUnitsData || layersAdded.current)
      return;

    // Add GeoJSON source with ALL districts (no filtering at source level)
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: orgUnitsData,
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
    map.addLayer({
      id: ACTIVE_FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": [
          "match",
          ["get", "interventionStatus"],
          "completed",
          interventionColors.completed,
          "ongoing",
          interventionColors.ongoing,
          "planned",
          interventionColors.planned,
          interventionColors.none, // Default for "none" or unknown
        ],
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
  }, [isLoaded, map, isLoading, orgUnitsData]);

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
      const interventions: string[] = JSON.parse(props.interventions || "[]");

      const interventionList = interventions.length
        ? interventions.map((i: string) => `• ${i}`).join("<br>")
        : "No interventions";

      map.getCanvas().style.cursor = "pointer";

      popup
        .setLngLat(e.lngLat)
        .setHTML(`
          <strong>${props.districtName}</strong>
          <div style="margin-top: 4px; font-size: 12px;">${interventionList}</div>
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
