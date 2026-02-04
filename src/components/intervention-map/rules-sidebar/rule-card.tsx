"use client";

import { Trash2, Pencil, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SavedRule } from "@/types/rule";
import type { MetricType, InterventionCategory } from "@/types/intervention";

interface RuleCardProps {
  rule: SavedRule;
  metricTypes: MetricType[];
  interventionCategories: InterventionCategory[];
  onEdit: (ruleId: string) => void;
  onDelete: (ruleId: string) => void;
  onToggleVisibility: (ruleId: string) => void;
  /** Function to look up district name by ID */
  getDistrictName: (districtId: string) => string;
  /** Whether this card is selected */
  isSelected?: boolean;
  /** Callback when card is clicked to select/deselect */
  onSelect?: (ruleId: string) => void;
}

export function RuleCard({
  rule,
  metricTypes,
  interventionCategories,
  onEdit,
  onDelete,
  onToggleVisibility,
  getDistrictName,
  isSelected,
  onSelect,
}: RuleCardProps) {
  const isVisible = rule.isVisible !== false; // Default to true if undefined

  // Build criteria details for tooltip
  const criteriaDetails = rule.criteria.map((c) => {
    const metric = metricTypes.find((m) => m.id === c.metricTypeId);
    return `${metric?.name ?? "Unknown"} ${c.operator} ${c.value}`;
  });
  const criteriaCount = rule.criteria.length;
  const criteriaLabel = rule.isAllDistricts
    ? "All districts"
    : criteriaCount > 0
      ? `${criteriaCount} ${criteriaCount === 1 ? "criterion" : "criteria"}`
      : "No criteria";

  // Build intervention names
  const interventionNames: string[] = [];
  rule.interventionsByCategory.forEach((interventionId, categoryId) => {
    const category = interventionCategories.find((c) => c.id === categoryId);
    if (category) {
      const intervention = category.interventions.find((i) => i.id === interventionId);
      if (intervention) {
        interventionNames.push(intervention.short_name || intervention.name);
      }
    }
  });

  return (
    <div
      className={`group relative p-3 text-card-foreground transition-colors rounded-lg cursor-pointer hover:border-secondary/50 duration-300 ${
        isSelected
          ? 'outline outline-2 outline-accent border border-transparent'
          : 'border border-[#E3E8EF]'
      } ${!isVisible ? 'opacity-40' : ''}`}
      onClick={() => onSelect?.(rule.id)}
    >
      {/* Floating action buttons */}
      <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={(e) => { e.stopPropagation(); onEdit(rule.id); }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(rule.id); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Intervention title */}
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 shrink-0 rounded cursor-pointer hover:opacity-80 transition-opacity"
          style={isVisible
            ? { backgroundColor: rule.color }
            : { border: '2px solid #D1D5DB' }
          }
          title={isVisible ? "Hide rule" : "Show rule"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(rule.id);
          }}
        />
        <span className="text-md font-semibold text-primary truncate">
          {rule.title}
        </span>
      </div>

      {/* Criteria + exceptions on same line */}
      <div className="flex items-center gap-2 mt-2 ml-6">
        <div className="flex items-center gap-1 flex-1">
          {criteriaCount > 0 && !rule.isAllDistricts ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-secondary shrink-0 cursor-default" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <ul className="text-xs space-y-1">
                    {criteriaDetails.map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Info className="h-3.5 w-3.5 text-secondary shrink-0" />
          )}
          <span className="text-xs text-secondary">{criteriaLabel}</span>
        </div>
        {rule.excludedDistrictIds && rule.excludedDistrictIds.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center rounded-full bg-primary w-5 h-5 text-xs font-medium text-white shrink-0 cursor-default">
                  {rule.excludedDistrictIds.length}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="text-xs">
                  <div className="font-semibold mb-1">Exceptions:</div>
                  <ul className="list-disc list-inside">
                    {rule.excludedDistrictIds.map((id) => (
                      <li key={id}>{getDistrictName(id)}</li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
