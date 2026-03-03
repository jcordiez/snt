"use client";

import React from "react";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SavedRule } from "@/types/rule";

interface RuleCardProps {
  rule: SavedRule;
  onEdit: (ruleId: string) => void;
  onDelete: (ruleId: string) => void;
  onToggleVisibility: (ruleId: string) => void;
  /** Function to look up district name by ID */
  getDistrictName: (districtId: string) => string;
  /** Number of districts matching this rule (after exclusions/inclusions) */
  matchingDistrictCount: number;
  /** Whether this card is selected */
  isSelected?: boolean;
  /** Callback when card is clicked to select/deselect */
  onSelect?: (ruleId: string) => void;
}

export function RuleCard({
  rule,
  onEdit,
  onDelete,
  onToggleVisibility,
  getDistrictName,
  matchingDistrictCount,
  isSelected,
  onSelect,
}: RuleCardProps) {
  const isVisible = rule.isVisible !== false; // Default to true if undefined

  return (
    <div
      className={`group relative p-4 text-card-foreground transition-colors rounded-lg cursor-pointer hover:border-secondary/50 duration-300 ${
        isSelected
          ? 'outline outline-2 outline-accent border border-transparent'
          : 'border border-[#E3E8EF]'
      } ${!isVisible ? 'opacity-40' : ''}`}
      onClick={() => onSelect?.(rule.id)}
    >
      {/* Floating action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-secondary/10 hover:text-secondary-foreground"
          onClick={(e) => { e.stopPropagation(); onDelete(rule.id); }}
        >
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Intervention title */}
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 shrink-0 rounded cursor-pointer hover:opacity-20 transition-opacity"
          style={isVisible
            ? { backgroundColor: rule.color }
            : { border: '2px solid #D1D5DB' }
          }
          title={isVisible ? "Hide rule" : "Show rule"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(rule.id);
          }}
        />
        <span className="text-md font-semibold text-primary truncate">
          {rule.title}
        </span>
      </div>

      {/* District count + inclusion/exclusion badges */}
      <div className="flex items-center gap-2 my-2 ml-7">
        <span className="inline-flex items-center px-2 py-1 rounded-sm bg-[#ECEDEE] text-xs font-medium text-[#3A4454] tracking-wide">
          {matchingDistrictCount} district{matchingDistrictCount !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1">
        {rule.inclusionEntries && rule.inclusionEntries.length > 0 && (() => {
          const totalIncludedDistricts = rule.inclusionEntries.reduce(
            (sum, entry) => sum + entry.districtIds.length,
            0
          );
          return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center rounded-full text-green-600 w-5 h-5 text-sm font-semibold  shrink-0 cursor-default">
                  +{totalIncludedDistricts}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="text-xs">
                  <div className="font-semibold mb-1">Included:</div>
                  <ul className="list-disc list-inside">
                    {rule.inclusionEntries.map((entry) => (
                      <li key={`${entry.level}-${entry.id}`}>
                        {entry.name}
                        {entry.level === "region" && ` (${entry.districtIds.length} districts)`}
                      </li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );})()}
        {rule.excludedDistrictIds && rule.excludedDistrictIds.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center rounded-full text-red-600 w-5 h-5 text-sm font-semibold  shrink-0 cursor-default">
                  -{rule.excludedDistrictIds.length}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="text-xs">
                  <div className="font-semibold mb-1">Excluded:</div>
                  <ul className="list-disc list-inside">
                    {rule.excludedDistrictIds.map((id) => (
                      <li key={id}>{getDistrictName(id)}</li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        </div>
      </div>
    </div>
  );
}
