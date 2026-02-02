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
      className={`group text-card-foreground transition-colors ${!isVisible ? 'opacity-40' : ''}`}
    >
      {/* Header */}
      <div className="py-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-sm flex-shrink-0"
            style={{ backgroundColor: rule.color }}
          />
          <h3 className="text-sm font-medium">{rule.title}</h3>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => onToggleVisibility(rule.id)}
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
            className={`text-xs text-muted-foreground ${showAllCriteria ? "" : "line-clamp-2 cursor-pointer"}`}
            onClick={() => { if (!showAllCriteria) setShowAllCriteria(true); }}
          >
            {criteriaString}
          </p>

          {/* Intervention tags */}
          {interventionTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {interventionTags.map((tag) => (
                <span
                  key={tag.name}
                  className="inline-flex items-center rounded-md bg-slate-200 px-1.5 py-0.5 text-xs font-semibold text-slate-600"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
