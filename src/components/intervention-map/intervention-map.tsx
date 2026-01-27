"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Map, MapControls, useMap } from "@/components/ui/map";
import { DistrictLayer } from "./district-layer";
import { MapLegend } from "./map-legend";
import { SelectionWidget } from "./selection-widget";
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
  /** Whether any rules are defined (for SelectionWidget button states) */
  hasRules?: boolean;
  /** Callback when "Set as exceptions" is clicked in SelectionWidget */
  onSetAsExceptions?: (districtIds: string[]) => void;
  /** Callback when "Remove from exceptions" is clicked in SelectionWidget */
  onRemoveFromExceptions?: (districtIds: string[]) => void;
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

export function InterventionMap({ selectedProvince, highlightedDistrictIds = [], districts, onSelectMix, metricValuesByOrgUnit, hasRules = false, onSetAsExceptions, onRemoveFromExceptions }: InterventionMapProps) {
  // Compute active district IDs based on selected province
  // When a province is selected, only districts in that province are active/selectable
  const activeDistrictIds = useMemo(() => {
    if (!districts?.features) return undefined;
    if (!selectedProvince) return undefined; // No filter when no province selected - all districts are active

    const ids = new Set<string>();
    for (const feature of districts.features) {
      if (feature.properties.regionId === selectedProvince.id) {
        ids.add(feature.properties.districtId);
      }
    }
    return ids;
  }, [districts, selectedProvince]);

  // Selection state for district multi-select feature
  // Pass activeDistrictIds so selection is cleared when districts become inactive
  const { selectedDistrictIds, selectDistrict, clearSelection, selectionCount } = useDistrictSelection({ activeDistrictIds });

  // Handlers for SelectionWidget actions
  const handleSetAsExceptions = useCallback(() => {
    const districtIds = Array.from(selectedDistrictIds);
    onSetAsExceptions?.(districtIds);
    clearSelection();
  }, [selectedDistrictIds, onSetAsExceptions, clearSelection]);

  const handleRemoveFromExceptions = useCallback(() => {
    const districtIds = Array.from(selectedDistrictIds);
    onRemoveFromExceptions?.(districtIds);
    clearSelection();
  }, [selectedDistrictIds, onRemoveFromExceptions, clearSelection]);

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
          selectedDistrictIds={selectedDistrictIds}
          districts={districts}
          metricValuesByOrgUnit={metricValuesByOrgUnit}
          onDistrictClick={selectDistrict}
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

      {/* Selection Widget - shows when districts are selected */}
      <SelectionWidget
        selectionCount={selectionCount}
        onSetAsExceptions={handleSetAsExceptions}
        onRemoveFromExceptions={handleRemoveFromExceptions}
        hasRules={hasRules}
      />

      {/* Map Legend
      <MapLegend districts={districts} onSelectMix={onSelectMix} />
      */}
    </div>
  );
}
