"use client";
import { Blend, ChevronDown } from "lucide-react";
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
  /** Callback when a specific category is selected from the add menu */
  onAddRuleForCategory?: (categoryId: number) => void;
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
  onAddRuleForCategory,
  selectedRuleId,
  onSelectRule,
}: RulesSidebarProps) {
  const handleSelectRule = (ruleId: string) => {
    const newValue = selectedRuleId === ruleId ? null : ruleId;
    onSelectRule?.(newValue);
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#E3E8EF] shrink-0">
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
              {/* Intervention categories */}
              <DropdownMenuGroup>
                <DropdownMenuLabel>Single intervention</DropdownMenuLabel>
                {interventionCategories.map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    onClick={() => onAddRuleForCategory?.(category.id)}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

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
