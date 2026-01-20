"use client";

import { useState, useCallback } from "react";
import {
  InterventionMap,
  CountryName,
  GeographicFilter,
} from "@/components/intervention-map";
import {
  AddInterventionButton,
  AddInterventionSheet,
} from "@/components/intervention-map/add-intervention";
import { countryConfig, Province } from "@/data/districts";
import { useOrgUnits } from "@/hooks/use-orgunits";

export default function Home() {
  const { data: districts, provinces, isLoading } = useOrgUnits();
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [highlightedDistrictIds, setHighlightedDistrictIds] = useState<string[]>([]);

  const displayName = selectedProvince?.name ?? countryConfig.name;

  const handleHighlightDistricts = useCallback((districtIds: string[]) => {
    setHighlightedDistrictIds(districtIds);
  }, []);

  const handleApplyInterventions = useCallback((districtIds: string[], interventionIds: number[]) => {
    // In-memory only - changes reset on page refresh (per PRD decisions)
    console.log("Applied interventions:", { districtIds, interventionIds });
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header - Row 1: Country Name */}
      <header className="px-6 py-4 border-b">
        <CountryName name={displayName} />
      </header>

      {/* Header - Row 2: Filters and Actions */}
      <div className="px-6 py-3 border-b flex items-center justify-between">
        <GeographicFilter
          provinces={provinces}
          selectedProvinceId={selectedProvince?.id ?? null}
          onProvinceChange={setSelectedProvince}
          isLoading={isLoading}
        />
        <AddInterventionButton onClick={() => setIsSheetOpen(true)} />
      </div>

      {/* Map Container */}
      <main className="flex-1 relative">
        <InterventionMap
          selectedProvince={selectedProvince}
          highlightedDistrictIds={highlightedDistrictIds}
        />
      </main>

      {/* Add Intervention Sheet */}
      <AddInterventionSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        districts={districts}
        onHighlightDistricts={handleHighlightDistricts}
        onApplyInterventions={handleApplyInterventions}
      />
    </div>
  );
}
