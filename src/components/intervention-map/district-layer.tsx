"use client";

import { useEffect, useRef, useMemo } from "react";
import maplibregl from "maplibre-gl";
import type MapLibreGL from "maplibre-gl";
import { useMap } from "@/components/ui/map";
import { getColorForInterventionMix, PREDEFINED_INTERVENTION_COLORS } from "@/lib/intervention-colors";
import type { DistrictProperties } from "@/data/districts";
import type { MetricValuesByOrgUnit } from "./intervention-map";

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
  /** Metric values by org unit ID for tooltip display */
  metricValuesByOrgUnit?: MetricValuesByOrgUnit;
  /** Callback when a district is clicked. Receives the district ID and whether shift key was held. */
  onDistrictClick?: (districtId: string, shiftKey: boolean) => void;
}

// Helper function to build color expression from districts data
// Priority: ruleColor (if set) > interventionMixLabel-based color
function buildColorExpression(
  districtsData: GeoJSON.FeatureCollection<GeoJSON.MultiPolygon | GeoJSON.Polygon, DistrictProperties> | null | undefined
): MapLibreGL.ExpressionSpecification | string {
  if (!districtsData?.features) {
    return PREDEFINED_INTERVENTION_COLORS["CM"];
  }

  // Build color map from districts for fallback (interventionMixLabel-based)
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

  // Build fallback expression for when ruleColor is not set
  const fallbackExpression = matchCases.length > 0
    ? [
        "match",
        ["get", "interventionMixLabel"],
        ...matchCases,
        PREDEFINED_INTERVENTION_COLORS["CM"],
      ]
    : PREDEFINED_INTERVENTION_COLORS["CM"];

  // Use case expression: if ruleColor exists and is not empty, use it; otherwise fallback
  return [
    "case",
    ["all", ["has", "ruleColor"], ["!=", ["get", "ruleColor"], ""]],
    ["get", "ruleColor"],
    fallbackExpression,
  ] as unknown as MapLibreGL.ExpressionSpecification;
}

export function DistrictLayer({ selectedProvinceId, highlightedDistrictIds = [], districts, metricValuesByOrgUnit, onDistrictClick }: DistrictLayerProps) {
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
    // Wait for map to be ready and districts data to be loaded
    if (!isLoaded || !map || !districts) return;

    // Check if source already exists (layers already added)
    // This prevents re-adding layers when districts data updates
    if (map.getSource(SOURCE_ID)) {
      layersAdded.current = true;
      return;
    }

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

    // Set initial filters immediately after creating layers
    // Without this, the filter effect may not run (its deps don't include districts)
    if (selectedProvinceId) {
      const activeFilter: MapLibreGL.FilterSpecification = [
        "==",
        ["get", "regionId"],
        selectedProvinceId,
      ];
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
      map.setFilter(INACTIVE_FILL_LAYER_ID, ["==", ["get", "regionId"], "__none__"]);
      map.setFilter(INACTIVE_BORDER_LAYER_ID, ["==", ["get", "regionId"], "__none__"]);
    }

    layersAdded.current = true;
  }, [isLoaded, map, districts, selectedProvinceId]);

  // Cleanup effect - only runs on unmount
  useEffect(() => {
    return () => {
      if (!map) return;
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
  }, [map]);

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

    // Debug: Log all unique interventionMixLabels in the data
    const labels = new Set<string>();
    districts?.features.forEach(f => {
      if (f.properties.interventionMixLabel) {
        labels.add(f.properties.interventionMixLabel);
      }
    });
    console.log("Unique interventionMixLabels in districts:", Array.from(labels));
    console.log("mixColorMap entries:", Array.from(mixColorMap.entries()));

    // Build a dynamic match expression for intervention mix colors (fallback)
    // All districts have interventionMixLabel set (CM by default)
    // Build match cases: [label1, color1, label2, color2, ...]
    const matchCases: string[] = [];
    mixColorMap.forEach((color, label) => {
      matchCases.push(label, color);
    });

    // Build fallback expression based on interventionMixLabel
    const fallbackExpression = matchCases.length > 0
      ? [
          "match",
          ["get", "interventionMixLabel"],
          ...matchCases,
          PREDEFINED_INTERVENTION_COLORS["CM"],
        ]
      : PREDEFINED_INTERVENTION_COLORS["CM"];

    // Use case expression: if ruleColor exists and is not empty, use it; otherwise fallback
    // This allows rule-based coloring to take priority over label-based coloring
    const colorExpression = [
      "case",
      ["all", ["has", "ruleColor"], ["!=", ["get", "ruleColor"], ""]],
      ["get", "ruleColor"],
      fallbackExpression,
    ] as unknown as MapLibreGL.ExpressionSpecification;

    console.log("Setting fill-color expression:", colorExpression);

    // Verify layer exists before setting property
    const layer = map.getLayer(ACTIVE_FILL_LAYER_ID);
    console.log("Active fill layer exists:", !!layer);
    if (!layer) {
      console.error("ACTIVE_FILL_LAYER does not exist!");
      return;
    }

    try {
      map.setPaintProperty(ACTIVE_FILL_LAYER_ID, "fill-color", colorExpression);
      console.log("setPaintProperty succeeded");
    } catch (e) {
      console.error("setPaintProperty failed:", e);
    }

    // Update the source data when districts changes
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (source && districts) {
      console.log("Updating source data with", districts.features.length, "features");

      // Debug: Check a sample feature's interventionMixLabel before sending to MapLibre
      const sampleFeature = districts.features.find(f => f.properties.interventionMixLabel !== "CM");
      console.log("Sample non-CM feature to send:", sampleFeature?.properties);

      source.setData(districts);

      // Debug: Query features from MapLibre to verify they have the updated properties
      setTimeout(() => {
        const renderedFeatures = map.querySourceFeatures(SOURCE_ID);
        const nonCmFeatures = renderedFeatures.filter(f => f.properties?.interventionMixLabel !== "CM");
        console.log("MapLibre source features count:", renderedFeatures.length);
        console.log("Non-CM features in MapLibre:", nonCmFeatures.length);
        if (nonCmFeatures.length > 0) {
          console.log("Sample non-CM feature from MapLibre:", nonCmFeatures[0].properties);
        }
      }, 100);
    }

    // Debug: Check what filters are set on layers
    console.log("Active fill filter:", map.getFilter(ACTIVE_FILL_LAYER_ID));
    console.log("Inactive fill filter:", map.getFilter(INACTIVE_FILL_LAYER_ID));

    // Force repaint
    map.triggerRepaint();
  }, [isLoaded, map, mixColorMap, districts]);

  // Click handler for district selection
  useEffect(() => {
    if (!isLoaded || !map || !onDistrictClick) return;

    const handleClick = (e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] }) => {
      if (!e.features?.length) return;

      const props = e.features[0].properties;
      const districtId = props.districtId;

      if (districtId) {
        // Pass the district ID and whether shift was held
        onDistrictClick(String(districtId), e.originalEvent.shiftKey);
      }
    };

    // Only attach click handler to ACTIVE fill layer (inactive districts are not clickable)
    map.on("click", ACTIVE_FILL_LAYER_ID, handleClick);

    return () => {
      map.off("click", ACTIVE_FILL_LAYER_ID, handleClick);
    };
  }, [isLoaded, map, onDistrictClick]);

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

      // Get metric values for this district
      const districtId = Number(props.districtId);

      const formatMetric = (value: number | undefined, decimals: number = 2): string => {
        return value !== undefined ? value.toFixed(decimals) : "N/A";
      };

      const mortalityValue = formatMetric(metricValuesByOrgUnit?.mortality?.[districtId], 1);
      const incidenceValue = formatMetric(metricValuesByOrgUnit?.incidence?.[districtId], 1);
      const resistanceValue = formatMetric(metricValuesByOrgUnit?.resistance?.[districtId], 2);
      const seasonalityValue = formatMetric(metricValuesByOrgUnit?.seasonality?.[districtId], 2);

      map.getCanvas().style.cursor = "pointer";

      popup
        .setLngLat(e.lngLat)
        .setHTML(`
          <strong>${props.districtName}</strong>
          <table style="margin-top: 6px; font-size: 12px; border-collapse: collapse;">
            <tr>
              <td style="color: #666; padding-right: 8px;">Mortality:</td>
              <td style="text-align: right;">${mortalityValue}</td>
            </tr>
            <tr>
              <td style="color: #666; padding-right: 8px;">Incidence:</td>
              <td style="text-align: right;">${incidenceValue}</td>
            </tr>
            <tr>
              <td style="color: #666; padding-right: 8px;">Insecticide Resistance:</td>
              <td style="text-align: right;">${resistanceValue}</td>
            </tr>
            <tr>
              <td style="color: #666; padding-right: 8px;">Seasonality:</td>
              <td style="text-align: right;">${seasonalityValue}</td>
            </tr>
          </table>
          <div style="margin-top: 6px; font-size: 12px; color: #666;">Interventions:</div>
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
  }, [isLoaded, map, metricValuesByOrgUnit]);

  return null;
}
