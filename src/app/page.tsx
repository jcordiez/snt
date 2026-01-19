"use client";

import { useState } from "react";
import {
  InterventionMap,
  CountryName,
  GeographicFilter,
} from "@/components/intervention-map";
import { countryConfig, Province } from "@/data/districts";
import { useOrgUnits } from "@/hooks/use-orgunits";

export default function Home() {
  const { provinces, isLoading } = useOrgUnits();
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);

  const displayName = selectedProvince?.name ?? countryConfig.name;

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
      </div>

      {/* Map Container */}
      <main className="flex-1 relative">
        <InterventionMap selectedRegionId={selectedProvince?.id ?? null} />
      </main>
    </div>
  );
}
