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
import { useOrgUnits, createInterventionMix } from "@/hooks/use-orgunits";
import { useInterventionCategories } from "@/hooks/use-intervention-categories";

export default function Home() {
  const { data: districts, provinces, isLoading, updateDistricts } = useOrgUnits();
  const { data: interventionCategories } = useInterventionCategories();
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [highlightedDistrictIds, setHighlightedDistrictIds] = useState<string[]>([]);

  const displayName = selectedProvince?.name ?? countryConfig.name;

  const handleHighlightDistricts = useCallback((districtIds: string[]) => {
    setHighlightedDistrictIds(districtIds);
  }, []);

  const handleApplyInterventions = useCallback((
    districtIds: string[],
    selectedInterventionsByCategory: Map<number, number>
  ) => {
    // Create the intervention mix from category selections
    const interventionMix = createInterventionMix(
      selectedInterventionsByCategory,
      interventionCategories
    );

    // Update districts with the new intervention mix (in-memory only)
    updateDistricts(districtIds, interventionMix);

    console.log("Applied interventions:", {
      districtIds,
      interventionMix: {
        displayLabel: interventionMix.displayLabel,
        categoryAssignments: Object.fromEntries(interventionMix.categoryAssignments),
      },
    });
  }, [interventionCategories, updateDistricts]);

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
          districts={districts}
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
