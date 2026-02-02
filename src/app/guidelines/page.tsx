"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getFormattedThreshold } from "@/data/intervention-guidelines";
import { GUIDELINE_VARIATIONS } from "@/data/intervention-guidelines-variations";
import type { GuidelineCriterion } from "@/data/intervention-guidelines";

interface CriterionTooltipProps {
  criterion: GuidelineCriterion;
}

function CriterionTooltip({ criterion }: CriterionTooltipProps) {
  return (
    <div className="space-y-2 text-sm max-w-xs">
      <div>
        <div className="font-medium text-primary-foreground">{criterion.indicatorName}</div>
        {criterion.description && (
          <p className="text-primary-foreground/80 mt-1">{criterion.description}</p>
        )}
      </div>
      <div className="space-y-1 text-primary-foreground/80">
        <div>
          <span className="font-medium">WHO Threshold:</span> {getFormattedThreshold(criterion)}
        </div>
      </div>
    </div>
  );
}

export default function GuidelinesPage() {
  const [selectedVariationId, setSelectedVariationId] = useState<string>(
    GUIDELINE_VARIATIONS[0].id
  );
  const [collapsedInterventions, setCollapsedInterventions] = useState<Set<string>>(
    new Set()
  );

  const selectedVariation = GUIDELINE_VARIATIONS.find(
    (v) => v.id === selectedVariationId
  ) || GUIDELINE_VARIATIONS[0];

  const toggleIntervention = (interventionId: string) => {
    setCollapsedInterventions((prev) => {
      const next = new Set(prev);
      if (next.has(interventionId)) {
        next.delete(interventionId);
      } else {
        next.add(interventionId);
      }
      return next;
    });
  };

  return (
    <TooltipProvider>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-[240px] border-r bg-muted/20 p-4 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              Guideline Variations
            </h2>
          </div>
          <nav className="space-y-1 flex-1">
            {GUIDELINE_VARIATIONS.map((variation) => (
              <button
                key={variation.id}
                onClick={() => setSelectedVariationId(variation.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                  ${
                    selectedVariationId === variation.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted text-foreground"
                  }
                `}
              >
                {variation.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-2">{selectedVariation.name}</h1>
            <p className="text-muted-foreground mb-2">{selectedVariation.description}</p>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Focus:</span> {selectedVariation.focus}
            </div>
          </div>

          <div className="space-y-2">
            {selectedVariation.guidelines.map((guideline) => {
              const isCollapsed = collapsedInterventions.has(guideline.id);

              return (
                <div key={guideline.id} className="border rounded-lg">
                  <button
                    onClick={() => toggleIntervention(guideline.id)}
                    className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{guideline.name}</div>
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="border-t">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <tbody>
                            {guideline.criteria.map((criterion, index) => (
                              <tr
                                key={criterion.id}
                                className={`border-b last:border-b-0 hover:bg-muted/30 transition-colors ${
                                  index % 2 === 0 ? "bg-muted/10" : ""
                                }`}
                              >
                                <td className="px-4 py-2 w-16">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button className="p-1 rounded hover:bg-muted">
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="p-3">
                                      <CriterionTooltip criterion={criterion} />
                                    </TooltipContent>
                                  </Tooltip>
                                </td>
                                <td className="px-4 py-2 text-sm w-1/2">{criterion.indicatorName}</td>
                                <td className="px-4 py-2 text-sm font-medium">
                                  {getFormattedThreshold(criterion)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
