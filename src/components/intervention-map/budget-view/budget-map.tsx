"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Map, MapControls, useMap } from "@/components/ui/map";
import type { DistrictProperties, Province } from "@/data/districts";
import { countryConfig } from "@/data/districts";
import {
  COST_COLOR_SCALE,
  calculateCostThresholds,
  buildCostColorExpression,
} from "@/lib/cost-colors";
import { CostScaleLegend } from "./cost-scale-legend";

interface BudgetMapProps {
  districts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null;
  selectedProvince: Province | null;
  /** Map of districtId -> cost */
  costByDistrictId: Map<string, number>;
  minCost: number;
  maxCost: number;
}

const SOURCE_ID = "budget-districts";
const FILL_LAYER_ID = "budget-district-fills";
const BORDER_LAYER_ID = "budget-district-borders";

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

/**
 * Handles auto-zoom when province selection changes
 */
function MapAutoZoom({ selectedProvince }: { selectedProvince: Province | null }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (!selectedProvince) {
      // Return to country view when no province is selected
      map.flyTo({
        center: countryConfig.center,
        zoom: countryConfig.zoom,
        duration: 500,
      });
    } else {
      // Zoom to province bounds
      const { bounds } = selectedProvince;
      map.fitBounds(
        [
          [bounds.west, bounds.south],
          [bounds.east, bounds.north],
        ],
        {
          padding: 50,
          maxZoom: 10,
          duration: 500,
        }
      );
    }
  }, [map, isLoaded, selectedProvince]);

  return null;
}

function BudgetDistrictLayer({
  districts,
  selectedProvince,
  costByDistrictId,
  minCost,
  maxCost,
}: BudgetMapProps) {
  const { map, isLoaded } = useMap();
  const layersAdded = useRef(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // Compute thresholds for color scale
  const thresholds = useMemo(
    () => calculateCostThresholds(minCost, maxCost),
    [minCost, maxCost]
  );

  // Enhance districts with cost property
  const enhancedDistricts = useMemo(() => {
    if (!districts) return null;

    return {
      ...districts,
      features: districts.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          districtCost:
            costByDistrictId.get(feature.properties.districtId) ?? 0,
        },
      })),
    };
  }, [districts, costByDistrictId]);

  // Initialize layers
  useEffect(() => {
    if (!isLoaded || !map || !enhancedDistricts) return;
    if (map.getSource(SOURCE_ID)) {
      layersAdded.current = true;
      return;
    }

    const colorExpression = buildCostColorExpression(thresholds);

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: enhancedDistricts,
    });

    map.addLayer({
      id: FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": colorExpression,
        "fill-opacity": 0.85,
      },
    });

    map.addLayer({
      id: BORDER_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#ffffff",
        "line-width": 1,
      },
    });

    layersAdded.current = true;
  }, [isLoaded, map, enhancedDistricts, thresholds]);

  // Update source data and colors when costs change
  useEffect(() => {
    if (!isLoaded || !map || !layersAdded.current || !enhancedDistricts) return;

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(enhancedDistricts);
    }

    const colorExpression = buildCostColorExpression(thresholds);
    if (map.getLayer(FILL_LAYER_ID)) {
      map.setPaintProperty(FILL_LAYER_ID, "fill-color", colorExpression);
    }
  }, [isLoaded, map, enhancedDistricts, thresholds]);

  // Filter by province
  useEffect(() => {
    if (!isLoaded || !map || !layersAdded.current) return;

    if (selectedProvince) {
      const filter: maplibregl.FilterSpecification = [
        "==",
        ["get", "regionId"],
        selectedProvince.id,
      ];
      map.setFilter(FILL_LAYER_ID, filter);
      map.setFilter(BORDER_LAYER_ID, filter);
    } else {
      map.setFilter(FILL_LAYER_ID, null);
      map.setFilter(BORDER_LAYER_ID, null);
    }
  }, [isLoaded, map, selectedProvince]);

  // Tooltip on hover
  useEffect(() => {
    if (!isLoaded || !map) return;

    if (!popupRef.current) {
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
      });
    }

    const popup = popupRef.current;

    const handleMouseMove = (
      e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }
    ) => {
      if (!e.features?.length) return;
      const props = e.features[0].properties;
      const cost = props.districtCost ?? 0;

      map.getCanvas().style.cursor = "pointer";
      popup
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <div style="font-family: system-ui, sans-serif; padding: 4px 0;">
            <strong style="font-size: 13px;">${props.districtName}</strong>
            <div style="margin-top: 4px; font-size: 12px;">
              <span style="color: #666;">Cost:</span>
              <span style="font-weight: 600; margin-left: 4px;">${formatCurrency(cost)}</span>
            </div>
          </div>
        `
        )
        .addTo(map);
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    };

    map.on("mousemove", FILL_LAYER_ID, handleMouseMove);
    map.on("mouseleave", FILL_LAYER_ID, handleMouseLeave);

    return () => {
      map.off("mousemove", FILL_LAYER_ID, handleMouseMove);
      map.off("mouseleave", FILL_LAYER_ID, handleMouseLeave);
      popup.remove();
    };
  }, [isLoaded, map]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (!map) return;
      try {
        if (map.getLayer(BORDER_LAYER_ID)) map.removeLayer(BORDER_LAYER_ID);
        if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {
        /* ignore */
      }
    };
  }, [map]);

  return null;
}

export function BudgetMap({
  districts,
  selectedProvince,
  costByDistrictId,
  minCost,
  maxCost,
}: BudgetMapProps) {
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border">
      <Map center={countryConfig.center} zoom={countryConfig.zoom} theme="light">
        <MapAutoZoom selectedProvince={selectedProvince} />
        <BudgetDistrictLayer
          districts={districts}
          selectedProvince={selectedProvince}
          costByDistrictId={costByDistrictId}
          minCost={minCost}
          maxCost={maxCost}
        />
        <MapControls position="bottom-right" showZoom={true} />
      </Map>

      {/* Cost Scale Legend */}
      <CostScaleLegend minCost={minCost} maxCost={maxCost} />
    </div>
  );
}
