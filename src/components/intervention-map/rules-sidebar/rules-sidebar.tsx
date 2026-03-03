"use client";
import React from "react";
import { Blend, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RuleCard } from "./rule-card";
import type { SavedRule } from "@/types/rule";

interface RulesSidebarProps {
  rules: SavedRule[];
  onAddRule: () => void;
  onEditRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
  onToggleVisibility: (ruleId: string) => void;
  onReorderRules?: (newOrder: SavedRule[]) => void;
  /** Function to look up district name by ID */
  getDistrictName: (districtId: string) => string;
  /** Map of rule ID to matching district count */
  matchingDistrictCounts: Record<string, number>;
  /** Currently selected rule ID (controlled) */
  selectedRuleId?: string | null;
  /** Callback when a rule is selected/deselected */
  onSelectRule?: (ruleId: string | null) => void;
}

export function RulesSidebar({
  rules,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onToggleVisibility,
  getDistrictName,
  matchingDistrictCounts,
  selectedRuleId,
  onSelectRule,
}: RulesSidebarProps) {
  const handleSelectRule = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    const isVisible = rule ? rule.isVisible !== false : true;

    if (!isVisible) {
      // First click on a hidden rule: make it visible, but don't select
      onToggleVisibility(ruleId);
      return;
    }

    // Rule is already visible: toggle selection
    const newValue = selectedRuleId === ruleId ? null : ruleId;
    onSelectRule?.(newValue);
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#E3E8EF] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/20">
            <Blend className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-lg font-medium text-primary">Packages</h2>
        </div>
        <Button variant="outline" size="icon" onClick={onAddRule}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable list of rules */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <div className="flex flex-col gap-2">
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No rules yet. Click + to add a rule.
            </p>
          ) : (
            rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onEdit={onEditRule}
                onDelete={onDeleteRule}
                onToggleVisibility={onToggleVisibility}
                getDistrictName={getDistrictName}
                matchingDistrictCount={matchingDistrictCounts[rule.id] ?? 0}
                isSelected={selectedRuleId === rule.id}
                onSelect={handleSelectRule}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
