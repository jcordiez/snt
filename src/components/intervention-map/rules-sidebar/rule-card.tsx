"use client";

import { useState } from "react";
import { Trash2, Eye, EyeOff, Pencil, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SavedRule, RuleCriterion } from "@/types/rule";
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

function formatInterventionMix(
  interventionsByCategory: Map<number, number>,
  coverageByCategory: Map<number, number> | undefined,
  interventionCategories: InterventionCategory[]
): string {
  if (interventionsByCategory.size === 0) {
    return "No interventions";
  }

  const names: string[] = [];
  interventionsByCategory.forEach((interventionId, categoryId) => {
    const category = interventionCategories.find((c) => c.id === categoryId);
    if (category) {
      const intervention = category.interventions.find(
        (i) => i.id === interventionId
      );
      if (intervention) {
        const name = intervention.short_name || intervention.name;
        const coverage = coverageByCategory?.get(categoryId) ?? DEFAULT_COVERAGE;
        names.push(`${name} (${coverage}%)`);
      }
    }
  });

  return names.length > 0 ? names.join(" + ") : "No interventions";
}

const MAX_VISIBLE_EXCEPTIONS = 3;

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

  const [criteriaExpanded, setCriteriaExpanded] = useState(false);

  const interventionMix = formatInterventionMix(
    rule.interventionsByCategory,
    rule.coverageByCategory,
    interventionCategories
  );

  const exceptions = rule.excludedDistrictIds ?? [];
  const visibleExceptions = exceptions.slice(0, MAX_VISIBLE_EXCEPTIONS);
  const remainingCount = exceptions.length - MAX_VISIBLE_EXCEPTIONS;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger edit if clicking on the action buttons
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    onEdit(rule.id);
  };

  return (
    <div
      className={`group rounded-lg border bg-card text-card-foreground shadow-sm cursor-pointer hover:border-primary/50 transition-colors ${!isVisible ? 'bg-gray-50 opacity-40' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(rule.id);
        }
      }}
    >
      {/* Header */}
      <div className="py-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: rule.color }}
          />
          <h3 className="text-sm font-medium">{rule.title}</h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(rule.id);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(rule.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {/* Content - Hidden when rule is not visible */}
      {isVisible && (
        <div className="py-2 px-4 pt-0 space-y-2">
          <div>
            {rule.isAllDistricts ? (
              <p className="text-xs text-muted-foreground">All districts</p>
            ) : rule.criteria.length > 0 ? (
              <>
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCriteriaExpanded(!criteriaExpanded);
                  }}
                >
                  <ChevronRight className={`h-3 w-3 transition-transform ${criteriaExpanded ? "rotate-90" : ""}`} />
                  {criteriaExpanded ? "Hide" : "Show"} criteria ({rule.criteria.length})
                </button>
                {criteriaExpanded && (
                  <table className="w-full mt-1 text-xs">
                    <tbody>
                      {rule.criteria.map((c) => {
                        const metric = metricTypes.find((m) => m.id === c.metricTypeId);
                        return (
                          <tr key={c.id}>
                            <td className="py-0.5 pr-2">{metric?.name ?? "Unknown"}</td>
                            <td className="py-0.5 pr-2" style={{ width: 44 }}>{c.operator}</td>
                            <td className="py-0.5" style={{ width: 44 }}>{c.value}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No criteria</p>
            )}
          </div>
          {exceptions.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Exceptions</p>
              <p className="text-xs">
                {visibleExceptions.map((id) => getDistrictName(id)).join(", ")}
                {remainingCount > 0 && (
                  <span className="text-muted-foreground">
                    {" "}and {remainingCount} more
                  </span>
                )}
              </p>
            </div>
          )}
          <div className="hidden">
            <p className="text-xs text-muted-foreground mb-1">Interventions</p>
            <p className="text-xs font-medium">{interventionMix}</p>
          </div>
        </div>
      )}
    </div>
  );
}
