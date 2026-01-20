"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { DistrictWithProperties } from "@/hooks/use-district-rules";

interface DistrictSelectionStepProps {
  matchingDistricts: DistrictWithProperties[];
  selectedDistrictIds: Set<string>;
  onToggleDistrict: (districtId: string) => void;
  onToggleAll: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function DistrictSelectionStep({
  matchingDistricts,
  selectedDistrictIds,
  onToggleDistrict,
  onToggleAll,
  onBack,
  onNext,
}: DistrictSelectionStepProps) {
  const allSelected = matchingDistricts.length > 0 &&
    matchingDistricts.every((d) => selectedDistrictIds.has(d.districtId));
  const hasSelection = selectedDistrictIds.size > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onBack} className="gap-1 px-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!hasSelection}>
          Apply interventions
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-3 pb-3 border-b">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onToggleAll}
        />
        <label className="text-sm">
          {allSelected ? "Unselect all" : "Select all"} ({matchingDistricts.length} districts)
        </label>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
        {matchingDistricts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No districts match the selected rules.
          </p>
        ) : (
          matchingDistricts.map((district) => (
            <div
              key={district.districtId}
              className="flex items-start gap-2 py-2"
            >
              <Checkbox
                checked={selectedDistrictIds.has(district.districtId)}
                onCheckedChange={() => onToggleDistrict(district.districtId)}
              />
              <div>
                <div className="text-sm font-medium">{district.districtName}</div>
                <div className="text-xs text-muted-foreground">
                  {district.regionName}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
