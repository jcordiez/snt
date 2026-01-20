"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { DistrictWithProperties } from "@/hooks/use-district-rules";
import type { InterventionCategory } from "@/types/intervention";

interface DistrictSelectionStepProps {
  matchingDistricts: DistrictWithProperties[];
  selectedDistrictIds: Set<string>;
  interventionCategories: InterventionCategory[];
  interventionsLoading: boolean;
  selectedInterventionIds: Set<number>;
  onToggleDistrict: (districtId: string) => void;
  onToggleAll: () => void;
  onToggleIntervention: (interventionId: number) => void;
  onBack: () => void;
  onApply: () => void;
}

export function DistrictSelectionStep({
  matchingDistricts,
  selectedDistrictIds,
  interventionCategories,
  interventionsLoading,
  selectedInterventionIds,
  onToggleDistrict,
  onToggleAll,
  onToggleIntervention,
  onBack,
  onApply,
}: DistrictSelectionStepProps) {
  const allSelected = matchingDistricts.length > 0 &&
    matchingDistricts.every((d) => selectedDistrictIds.has(d.districtId));
  const hasDistrictSelection = selectedDistrictIds.size > 0;
  const hasInterventionSelection = selectedInterventionIds.size > 0;
  const canApply = hasDistrictSelection && hasInterventionSelection;
  const districtCount = selectedDistrictIds.size;
  const applyButtonLabel = canApply
    ? `Apply to ${districtCount} district${districtCount !== 1 ? "s" : ""}`
    : "Select interventions to apply";

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={onBack} className="gap-1 px-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto space-y-6 min-h-0">
        {/* Districts section */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Selected Districts</h3>

          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onToggleAll}
            />
            <label className="text-sm">
              {allSelected ? "Unselect all" : "Select all"} ({matchingDistricts.length} districts)
            </label>
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {matchingDistricts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No districts match the selected rules.
              </p>
            ) : (
              matchingDistricts.map((district) => (
                <div
                  key={district.districtId}
                  className="flex items-start gap-2 py-1"
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

        {/* Interventions section */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Select Interventions</h3>

          <div className="space-y-4">
            {interventionsLoading ? (
              <p className="text-sm text-muted-foreground">Loading interventions...</p>
            ) : (
              interventionCategories.map((category) => (
                <div key={category.id}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    {category.name}
                  </h4>
                  <div className="space-y-2 pl-2">
                    {category.interventions.map((intervention) => (
                      <div
                        key={intervention.id}
                        className="flex items-start gap-2"
                      >
                        <Checkbox
                          checked={selectedInterventionIds.has(intervention.id)}
                          onCheckedChange={() => onToggleIntervention(intervention.id)}
                        />
                        <div>
                          <div className="text-sm">{intervention.name}</div>
                          {intervention.description && (
                            <div className="text-xs text-muted-foreground">
                              {intervention.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sticky footer with Apply button */}
      <div className="pt-4 border-t mt-auto sticky bottom-0 bg-background">
        <Button
          onClick={onApply}
          disabled={!canApply}
          className="w-full"
        >
          {applyButtonLabel}
        </Button>
        {!hasDistrictSelection && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Select at least one district
          </p>
        )}
      </div>
    </div>
  );
}
