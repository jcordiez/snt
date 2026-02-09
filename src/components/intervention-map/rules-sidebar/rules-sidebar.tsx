"use client";
import React from "react";
import { ArrowRight, Blend, ChevronDown, GitMerge, LucideMerge, Merge, MoveRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { RuleCard } from "./rule-card";
import type { SavedRule } from "@/types/rule";
import type { MetricType, InterventionCategory } from "@/types/intervention";
import { GUIDELINE_VARIATIONS } from "@/data/intervention-guidelines-variations";

interface RulesSidebarProps {
  rules: SavedRule[];
  metricTypes: MetricType[];
  interventionCategories: InterventionCategory[];
  onAddRule: () => void;
  onEditRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
  onToggleVisibility: (ruleId: string) => void;
  onReorderRules?: (newOrder: SavedRule[]) => void;
  /** Function to look up district name by ID */
  getDistrictName: (districtId: string) => string;
  /** Callback when "Generate from Guidelines" is clicked with variation ID */
  onGenerateFromGuidelines?: (variationId: string) => void;
  /** Callback when interventions are selected from the add menu */
  onAddRuleWithInterventions?: (selections: { categoryId: number; interventionId: number }[]) => void;
  /** Whether cumulative mode is active */
  isCumulativeMode?: boolean;
  /** Toggle cumulative mode */
  onToggleCumulativeMode?: (value: boolean) => void;
  /** Currently selected rule ID (controlled) */
  selectedRuleId?: string | null;
  /** Callback when a rule is selected/deselected */
  onSelectRule?: (ruleId: string | null) => void;
}

export function RulesSidebar({
  rules,
  metricTypes,
  interventionCategories,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onToggleVisibility,
  getDistrictName,
  onGenerateFromGuidelines,
  onAddRuleWithInterventions,
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

  // ITN Campaign (40) and ITN Routine (41) share the same bednet types
  const ITN_CAMPAIGN_ID = 40;
  const ITN_ROUTINE_ID = 41;
  const itnCampaign = interventionCategories.find((c) => c.id === ITN_CAMPAIGN_ID);
  const itnRoutine = interventionCategories.find((c) => c.id === ITN_ROUTINE_ID);

  // Bednet types: match campaign + routine interventions by name
  const bednetItems = (itnCampaign?.interventions ?? []).map((campaignIntv) => {
    const routineIntv = itnRoutine?.interventions.find((r) => r.name === campaignIntv.name);
    return {
      label: `${campaignIntv.name} nets`,
      selections: [
        { categoryId: ITN_CAMPAIGN_ID, interventionId: campaignIntv.id },
        ...(routineIntv ? [{ categoryId: ITN_ROUTINE_ID, interventionId: routineIntv.id }] : []),
      ],
    };
  });

  // Non-bednet categories: all categories except ITN Campaign and ITN Routine
  const nonBednetCategories = interventionCategories.filter(
    (c) => c.id !== ITN_CAMPAIGN_ID && c.id !== ITN_ROUTINE_ID && c.interventions.length > 0
  );

  // Non-bednet interventions grouped by category
  const nonBednetGroups = nonBednetCategories.map((category) => ({
    items: category.interventions.map((intervention) => ({
      label: intervention.name,
      selections: [{ categoryId: category.id, interventionId: intervention.id }],
    })),
  }));

  // All groups: non-bednet groups + bednet group
  const allGroups = [
    ...(bednetItems.length > 0 ? [{ items: bednetItems }] : []),
    ...nonBednetGroups,
  ];

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#E3E8EF] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/20">
            <Blend className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-lg font-medium text-primary">Interventions</h2>
        </div>
        <div className="flex items-center gap-1">
          {/* Add rule dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Add
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {/* Interventions grouped with separators */}
              {allGroups.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  {groupIndex > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuGroup>
                    {group.items.map((item) => (
                      <DropdownMenuItem
                        key={item.label}
                        onClick={() => onAddRuleWithInterventions?.(item.selections)}
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </React.Fragment>
              ))}

              <DropdownMenuSeparator />

              {/* From guidelines */}
              <DropdownMenuGroup>
                <DropdownMenuLabel>From guidelines</DropdownMenuLabel>
                {GUIDELINE_VARIATIONS.map((variation) => (
                  <DropdownMenuItem
                    key={variation.id}
                    onClick={() => onGenerateFromGuidelines?.(variation.id)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="font-medium">{variation.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {variation.focus}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Custom intervention mix */}
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={onAddRule}>
                  Custom intervention mix
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {
          <Button   onClick={() => {}}>
                <ArrowRight className="h-4 w-4" />
              </Button>
              }
        </div>
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
                metricTypes={metricTypes}
                interventionCategories={interventionCategories}
                onEdit={onEditRule}
                onDelete={onDeleteRule}
                onToggleVisibility={onToggleVisibility}
                getDistrictName={getDistrictName}
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
