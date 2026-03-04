"use client";
import React from "react";
import { Blend, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RuleCard } from "./rule-card";
import { RuleEditorPanel } from "./rule-editor-panel";
import type { SavedRule } from "@/types/rule";
import type { MetricType, InterventionCategory } from "@/types/intervention";
import type { DistrictProperties } from "@/data/districts";

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
  /** Callback to generate rules from WHO guidelines */
  onGenerateFromGuidelines?: () => void;
  /** Props for the embedded rule editor */
  editorProps?: {
    metricTypes: MetricType[];
    groupedMetricTypes: Record<string, MetricType[]>;
    interventionCategories: InterventionCategory[];
    onSave: (rule: SavedRule) => void;
    districts: GeoJSON.FeatureCollection<
      GeoJSON.MultiPolygon | GeoJSON.Polygon,
      DistrictProperties
    > | null;
    metricValuesByType?: Record<number, Record<number, number>>;
    autoFocusRuleId?: string | null;
  };
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
  onGenerateFromGuidelines,
  editorProps,
}: RulesSidebarProps) {
  const selectedRule = selectedRuleId ? rules.find((r) => r.id === selectedRuleId) : null;
  const showEditor = selectedRule && editorProps;

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

  const handleBack = () => {
    onSelectRule?.(null);
  };

  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden">
      {/* Sliding container */}
      <div
        className="flex h-full transition-transform duration-300 ease-in-out"
        style={{ transform: showEditor ? "translateX(-100%)" : "translateX(0)" }}
      >
        {/* Rules List Panel */}
        <div className="w-full shrink-0 flex flex-col h-full min-h-0">
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
                  No packages yet. Click + to add a package, or{" "}
                  <button
                    className="font-semibold text-accent hover:underline"
                    onClick={onGenerateFromGuidelines}
                  >
                    start with WHO guidelines
                  </button>
                  .
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

        {/* Rule Editor Panel */}
        <div className="w-full shrink-0 flex flex-col h-full min-h-0">
          {selectedRule && editorProps && (
            <RuleEditorPanel
              rule={selectedRule}
              metricTypes={editorProps.metricTypes}
              groupedMetricTypes={editorProps.groupedMetricTypes}
              interventionCategories={editorProps.interventionCategories}
              onSave={editorProps.onSave}
              onClose={handleBack}
              getDistrictName={getDistrictName}
              districts={editorProps.districts}
              metricValuesByType={editorProps.metricValuesByType}
              autoFocusTitle={editorProps.autoFocusRuleId === selectedRuleId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
