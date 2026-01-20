"use client";

import { useEffect } from "react";
import { Map, MapControls, useMap } from "@/components/ui/map";
import { DistrictLayer } from "./district-layer";
import { MapLegend } from "./map-legend";
import { countryConfig, Province } from "@/data/districts";

interface InterventionMapProps {
  selectedProvince?: Province | null;
  highlightedDistrictIds?: string[];
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

export function InterventionMap({ selectedProvince, highlightedDistrictIds = [] }: InterventionMapProps) {
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
      <MapLegend />
    </div>
  );
}
