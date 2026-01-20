"use client";

import { Button } from "@/components/ui/button";
import { RuleRow } from "./rule-row";
import type { Rule, MetricType } from "@/types/intervention";

interface RuleBuilderStepProps {
  rules: Rule[];
  groupedMetricTypes: Record<string, MetricType[]>;
  isLoading: boolean;
  hasCompleteRules: boolean;
  matchingCount: number;
  onUpdateRule: (ruleId: string, updates: Partial<Rule>) => void;
  onDeleteRule: (ruleId: string) => void;
  onAddRule: () => void;
  onNext: () => void;
}

export function RuleBuilderStep({
  rules,
  groupedMetricTypes,
  isLoading,
  hasCompleteRules,
  matchingCount,
  onUpdateRule,
  onDeleteRule,
  onAddRule,
  onNext,
}: RuleBuilderStepProps) {
  const buttonLabel = hasCompleteRules
    ? `${matchingCount} district${matchingCount !== 1 ? "s" : ""} selected - Apply intervention`
    : "Select matching layers";
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Select districts where...
        </h3>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading metrics...</p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                groupedMetricTypes={groupedMetricTypes}
                onUpdate={onUpdateRule}
                onDelete={onDeleteRule}
                canDelete={rules.length > 1}
              />
            ))}
          </div>
        )}

        <Button
          variant="ghost"
          onClick={onAddRule}
          className="mt-3 text-sm"
          disabled={isLoading}
        >
          + Add rule
        </Button>
      </div>

      <div className="pt-4 border-t mt-auto">
        <Button
          onClick={onNext}
          disabled={!hasCompleteRules || matchingCount === 0}
          className="w-full"
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
