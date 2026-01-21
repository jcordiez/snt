"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SavedRule, RuleCriterion } from "@/types/rule";
import type { MetricType, InterventionCategory } from "@/types/intervention";

interface RuleCardProps {
  rule: SavedRule;
  metricTypes: MetricType[];
  interventionCategories: InterventionCategory[];
  onEdit: (ruleId: string) => void;
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

function formatInterventionMix(
  interventionsByCategory: Map<number, number>,
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
        names.push(intervention.short_name || intervention.name);
      }
    }
  });

  return names.length > 0 ? names.join(" + ") : "No interventions";
}

export function RuleCard({
  rule,
  metricTypes,
  interventionCategories,
  onEdit,
}: RuleCardProps) {
  const criteriaDescription = rule.criteria
    .map((c) => formatCriterion(c, metricTypes))
    .join(" AND ");

  const interventionMix = formatInterventionMix(
    rule.interventionsByCategory,
    interventionCategories
  );

  return (
    <div className="group rounded-lg border bg-card text-card-foreground shadow-sm">
      {/* Header */}
      <div className="py-3 px-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">{rule.title}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onEdit(rule.id)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
      {/* Content */}
      <div className="py-2 px-4 pt-0 space-y-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Criteria</p>
          <p className="text-xs">{criteriaDescription || "No criteria"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Interventions</p>
          <p className="text-xs font-medium">{interventionMix}</p>
        </div>
      </div>
    </div>
  );
}
