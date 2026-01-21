"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RuleCard } from "./rule-card";
import type { SavedRule } from "@/types/rule";
import type { MetricType, InterventionCategory } from "@/types/intervention";

interface RulesSidebarProps {
  rules: SavedRule[];
  metricTypes: MetricType[];
  interventionCategories: InterventionCategory[];
  onAddRule: () => void;
  onEditRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
}

export function RulesSidebar({
  rules,
  metricTypes,
  interventionCategories,
  onAddRule,
  onEditRule,
  onDeleteRule,
}: RulesSidebarProps) {
  return (
    <div className="w-80 border-l bg-gray-50 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <h2 className="text-sm font-semibold">Rules</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onAddRule}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable list of rules */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No rules yet. Click + to add a rule.
            </p>
          ) : (
            rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                metricTypes={metricTypes}
                interventionCategories={interventionCategories}
                onEdit={onEditRule}
                onDelete={onDeleteRule}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
