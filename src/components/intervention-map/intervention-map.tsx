"use client";

import { useEffect } from "react";
import { Map, MapControls, useMap } from "@/components/ui/map";
import { DistrictLayer } from "./district-layer";
import { MapLegend } from "./map-legend";
import { countryConfig, Province, DistrictProperties } from "@/data/districts";
import { useDistrictSelection } from "@/hooks/use-district-selection";

/** Metric values by org unit ID for tooltip display */
export interface MetricValuesByOrgUnit {
  mortality?: Record<number, number>;      // 407: Mortalité infanto-juvénile
  incidence?: Record<number, number>;      // 410: Incidence
  resistance?: Record<number, number>;     // 412: Résistance aux insecticides
  seasonality?: Record<number, number>;    // 413: Saisonnalité
}

interface InterventionMapProps {
  selectedProvince?: Province | null;
  highlightedDistrictIds?: string[];
  districts?: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null;
  onSelectMix?: (mixLabel: string, districtIds: string[]) => void;
  /** Metric values by org unit ID for tooltip display */
  metricValuesByOrgUnit?: MetricValuesByOrgUnit;
}

/**
 * Handles auto-zoom when province selection changes
 * - Zooms to province bounds when a province is selected
 * - Returns to country view when province is deselected
 */
function MapAutoZoom({ selectedProvince }: { selectedProvince?: Province | null }) {
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

export function InterventionMap({ selectedProvince, highlightedDistrictIds = [], districts, onSelectMix, metricValuesByOrgUnit }: InterventionMapProps) {
  // Selection state for district multi-select feature
  const { selectedDistrictIds, selectDistrict, clearSelection, selectionCount } = useDistrictSelection();

  return (
    <div className="relative w-full h-full">
      <Map
        center={countryConfig.center}
        zoom={countryConfig.zoom}
        theme="light"
      >
        <DistrictLayer
          selectedProvinceId={selectedProvince?.id ?? null}
          highlightedDistrictIds={highlightedDistrictIds}
          districts={districts}
          metricValuesByOrgUnit={metricValuesByOrgUnit}
        />
        <MapAutoZoom selectedProvince={selectedProvince} />
        <MapControls
          position="bottom-right"
          showZoom={true}
          showCompass={false}
          showLocate={false}
          showFullscreen={false}
        />
      </Map>

      {/* Map Legend 
      <MapLegend districts={districts} onSelectMix={onSelectMix} />
      */}
    </div>
  );
}
