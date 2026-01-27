"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SavedRule, RuleCriterion } from "@/types/rule";
import type { MetricType, InterventionCategory } from "@/types/intervention";

interface RuleCardProps {
  rule: SavedRule;
  metricTypes: MetricType[];
  interventionCategories: InterventionCategory[];
  onEdit: (ruleId: string) => void;
  onDelete: (ruleId: string) => void;
  /** Function to look up district name by ID */
  getDistrictName: (districtId: string) => string;
}

function formatCriterion(
  criterion: RuleCriterion,
  metricTypes: MetricType[]
): string {
  if (criterion.metricTypeId === null) {
    return "No metric selected";
  }
  const metric = metricTypes.find((m) => m.id === criterion.metricTypeId);
  const metricName = metric?.name ?? "Unknown metric";
  return `${metricName} ${criterion.operator} ${criterion.value}`;
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
  getDistrictName,
}: RuleCardProps) {
  const criteriaDescription = rule.isAllDistricts
    ? "All districts"
    : rule.criteria.map((c) => formatCriterion(c, metricTypes)).join(" AND ");

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
      className="group rounded-lg border bg-card text-card-foreground shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
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
            onClick={() => onDelete(rule.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {/* Content */}
      <div className="py-2 px-4 pt-0 space-y-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Criteria</p>
          <p className="text-xs">{criteriaDescription || "No criteria"}</p>
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
        <div>
          <p className="text-xs text-muted-foreground mb-1">Interventions</p>
          <p className="text-xs font-medium">{interventionMix}</p>
        </div>
      </div>
    </div>
  );
}
