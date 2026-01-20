"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { InterventionCategory } from "@/types/intervention";

interface InterventionSelectionStepProps {
  categories: InterventionCategory[];
  isLoading: boolean;
  selectedInterventionIds: Set<number>;
  onToggleIntervention: (interventionId: number) => void;
  onBack: () => void;
  onApply: () => void;
}

export function InterventionSelectionStep({
  categories,
  isLoading,
  selectedInterventionIds,
  onToggleIntervention,
  onBack,
  onApply,
}: InterventionSelectionStepProps) {
  const hasSelection = selectedInterventionIds.size > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onBack} className="gap-1 px-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Select the interventions to apply to the selected districts:
      </p>

      <div className="flex-1 overflow-y-auto space-y-4 max-h-[400px]">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading interventions...</p>
        ) : (
          categories.map((category) => (
            <div key={category.id}>
              <h4 className="text-sm font-semibold mb-2">{category.name}</h4>
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

      <div className="pt-4 border-t mt-auto">
        <Button
          onClick={onApply}
          disabled={!hasSelection}
          className="w-full"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
