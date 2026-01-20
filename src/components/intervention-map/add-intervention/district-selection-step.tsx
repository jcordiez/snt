"use client";

import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { DistrictWithProperties } from "@/hooks/use-district-rules";
import type { InterventionCategory } from "@/types/intervention";

interface DistrictSelectionStepProps {
  matchingDistricts: DistrictWithProperties[];
  selectedDistrictIds: Set<string>;
  interventionCategories: InterventionCategory[];
  interventionsLoading: boolean;
  selectedInterventionIds: Set<number>;
  /** Maps categoryId -> interventionId for single selection per category */
  selectedInterventionsByCategory: Map<number, number>;
  onToggleDistrict: (districtId: string) => void;
  onToggleAll: () => void;
  onToggleIntervention: (interventionId: number) => void;
  /** Handler for selecting one intervention per category (radio button behavior) */
  onSelectInterventionForCategory: (categoryId: number, interventionId: number | null) => void;
  onBack: () => void;
  onApply: () => void;
  /** Controls collapsed mode for legend selection */
  isFromLegendSelection?: boolean;
  /** For closing sheet directly in legend mode */
  onClose?: () => void;
}

export function DistrictSelectionStep({
  matchingDistricts,
  selectedDistrictIds,
  interventionCategories,
  interventionsLoading,
  selectedInterventionIds: _selectedInterventionIds,
  selectedInterventionsByCategory,
  onToggleDistrict,
  onToggleAll,
  onToggleIntervention: _onToggleIntervention,
  onSelectInterventionForCategory,
  onBack,
  onApply,
  isFromLegendSelection = false,
  onClose,
}: DistrictSelectionStepProps) {
  // Note: _selectedInterventionIds and _onToggleIntervention are deprecated
  // Keeping them for backwards compatibility but using category-based selection
  void _selectedInterventionIds;
  void _onToggleIntervention;

  const [isDistrictListExpanded, setIsDistrictListExpanded] = useState(!isFromLegendSelection);

  const allSelected = matchingDistricts.length > 0 &&
    matchingDistricts.every((d) => selectedDistrictIds.has(d.districtId));
  const hasDistrictSelection = selectedDistrictIds.size > 0;
  const hasInterventionSelection = selectedInterventionsByCategory.size > 0;
  const canApply = hasDistrictSelection && hasInterventionSelection;
  const districtCount = selectedDistrictIds.size;
  const applyButtonLabel = canApply
    ? `Apply to ${districtCount} district${districtCount !== 1 ? "s" : ""}`
    : "Select interventions to apply";

  const handleBackOrClose = () => {
    if (isFromLegendSelection && onClose) {
      onClose();
    } else {
      onBack();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with back/cancel button */}
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={handleBackOrClose} className="gap-1 px-2">
          {isFromLegendSelection ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4" />
              Back
            </>
          )}
        </Button>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto space-y-6 min-h-0">
        {/* Districts section */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Selected Districts</h3>

          {isFromLegendSelection && !isDistrictListExpanded ? (
            /* Collapsed mode: show count and Edit selection button */
            <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
              <span className="text-sm">
                {districtCount} district{districtCount !== 1 ? "s" : ""} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDistrictListExpanded(true)}
              >
                Edit selection
              </Button>
            </div>
          ) : (
            /* Expanded mode: show full district list */
            <>
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
            </>
          )}
        </div>

        {/* Interventions section */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Select Interventions</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Select one intervention per category. Categories without a selection will not be included.
          </p>

          <div className="space-y-4">
            {interventionsLoading ? (
              <p className="text-sm text-muted-foreground">Loading interventions...</p>
            ) : (
              interventionCategories.map((category) => {
                const selectedValue = selectedInterventionsByCategory.get(category.id);
                return (
                  <div key={category.id}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {category.name}
                    </h4>
                    <RadioGroup
                      value={selectedValue?.toString() ?? ""}
                      onValueChange={(value) => {
                        if (value === "") {
                          onSelectInterventionForCategory(category.id, null);
                        } else {
                          onSelectInterventionForCategory(category.id, parseInt(value, 10));
                        }
                      }}
                      className="pl-2"
                    >
                      {category.interventions.map((intervention) => (
                        <div
                          key={intervention.id}
                          className="flex items-start gap-2"
                        >
                          <RadioGroupItem
                            value={intervention.id.toString()}
                            id={`intervention-${intervention.id}`}
                          />
                          <label
                            htmlFor={`intervention-${intervention.id}`}
                            className="cursor-pointer flex-1"
                          >
                            <div className="text-sm">{intervention.name}</div>
                            {intervention.description && (
                              <div className="text-xs text-muted-foreground">
                                {intervention.description}
                              </div>
                            )}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                );
              })
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
