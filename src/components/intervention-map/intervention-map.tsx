"use client";

import { Map, MapControls } from "@/components/ui/map";
import { DistrictLayer } from "./district-layer";
import { MapLegend } from "./map-legend";
import { countryConfig } from "@/data/districts";

interface InterventionMapProps {
  selectedRegionId?: string | null;
}

export function InterventionMap({ selectedRegionId }: InterventionMapProps) {
  return (
    <div className="relative w-full h-full">
      <Map
        center={countryConfig.center}
        zoom={countryConfig.zoom}
        theme="light"
      >
        <DistrictLayer selectedRegionId={selectedRegionId} />
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
