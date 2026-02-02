"use client";

import { Plus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  /** Whether cumulative mode is active */
  isCumulativeMode?: boolean;
  /** Toggle cumulative mode */
  onToggleCumulativeMode?: (value: boolean) => void;
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
}: RulesSidebarProps) {
  return (
    <div className="w-96 border-l flex flex-col h-full min-h-0 overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shrink-0">
        <h2 className="text-sm font-semibold">Rules</h2>
        <div className="flex items-center gap-1">
          {/* Magic wand dropdown for generating rules from guidelines */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Wand2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Generate from Guidelines</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {GUIDELINE_VARIATIONS.map((variation) => (
                <DropdownMenuItem
                  key={variation.id}
                  onClick={() => onGenerateFromGuidelines?.(variation.id)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{variation.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {variation.focus}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add rule button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onAddRule}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable list of rules */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="divide-y">
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
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
