"use client";

import { useState } from "react";
import { Trash2, Eye, EyeOff, Pencil, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// Default coverage percentage for display (matches rule-edit-modal.tsx)
const DEFAULT_COVERAGE = 70;


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

  const [showAllCriteria, setShowAllCriteria] = useState(false);

  // Build criteria summary string
  const criteriaString = rule.isAllDistricts
    ? "All districts"
    : rule.criteria.length > 0
      ? rule.criteria.map((c) => {
          const metric = metricTypes.find((m) => m.id === c.metricTypeId);
          return `${metric?.name ?? "Unknown"} ${c.operator} ${c.value}`;
        }).join(", ")
      : "No criteria";

  // Build intervention tags
  const interventionTags: { name: string; coverage: number }[] = [];
  rule.interventionsByCategory.forEach((interventionId, categoryId) => {
    const category = interventionCategories.find((c) => c.id === categoryId);
    if (category) {
      const intervention = category.interventions.find((i) => i.id === interventionId);
      if (intervention) {
        const coverage = rule.coverageByCategory?.get(categoryId) ?? DEFAULT_COVERAGE;
        interventionTags.push({ name: intervention.short_name || intervention.name, coverage });
      }
    }
  });

  return (
    <div
      className={`group p-1 text-card-foreground transition-colors rounded-lg cursor-pointer hover:border-secondary/50 duration-300 ${
        isSelected
          ? 'outline outline-2 outline-accent border border-transparent'
          : 'border border-[#E3E8EF]'
      } ${!isVisible ? 'opacity-40' : ''}`}
      onClick={() => onSelect?.(rule.id)}
    >
      {/* Header */}
      <div className="py-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 flex-shrink-0 rounded-[4px]"
            style={{ backgroundColor: rule.color }}
          />
          <h3 className="text-md font-semibold text-primary">{rule.title}</h3>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(rule.id);
            }}
            title={isVisible ? "Hide rule" : "Show rule"}
          >
            {isVisible ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(rule.id)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(rule.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Content - Hidden when rule is not visible */}
      {isVisible && (
        <div className="pb-3 px-4 pt-0">
          {/* Criteria as text, max 2 lines, click ellipsis to expand */}
          <p
            className={`text-xs text-secondary ${showAllCriteria ? "" : "line-clamp-2 cursor-pointer"}`}
            onClick={() => { if (!showAllCriteria) setShowAllCriteria(true); }}
          >
            {criteriaString}
          </p>

          {/* Intervention tags and exceptions */}
          {(interventionTags.length > 0 || (rule.excludedDistrictIds && rule.excludedDistrictIds.length > 0)) && (
            <div className="flex items-start justify-between gap-2 mt-4">
              <div className="flex gap-1 flex-1">
                {interventionTags.slice(0, 2).map((tag) => (
                  <span
                    key={tag.name}
                    className="max-w-[120px] truncate items-center rounded-sm bg-[#ECEDEE] px-2 py-1 text-sm font-medium tracking-wide text-primary"
                  >
                    {tag.name}
                  </span>
                ))}
                {interventionTags.length > 2 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="hover:bg-accent/20 hover:text-accent inline-flex items-center rounded-sm border-secondary/20 border px-2 py-1 text-sm font-medium tracking-wide text-secondary cursor-default">
                          +{interventionTags.length - 2}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="p-4">
                        <table className="text-xs ">

                          <tbody>
                            {interventionTags.map((tag) => (
                              <tr key={tag.name}>
                                <td className=" py-1">{tag.name}</td>
                                <td className="text-right py-1">{tag.coverage}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {rule.excludedDistrictIds && rule.excludedDistrictIds.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-center rounded-full bg-[#FF9800] w-6 h-6 text-sm font-medium text-white shrink-0 cursor-default">
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
          )}
        </div>
      )}
    </div>
  );
}
