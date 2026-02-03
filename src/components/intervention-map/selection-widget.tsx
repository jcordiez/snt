"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectionWidgetProps {
  /** Number of selected districts */
  selectionCount: number;
  /** Total population of selected districts */
  totalPopulation?: number;
  /** Callback when "Add exception" is clicked */
  onSetAsExceptions: () => void;
  /** Callback to clear the selection */
  onClearSelection: () => void;
  /** Whether rules exist (buttons disabled if no rules) */
  hasRules?: boolean;
}

/** Format population number with K/M suffix */
function formatPopulation(pop: number): string {
  if (pop >= 1_000_000) {
    return `${(pop / 1_000_000).toFixed(1)}M`;
  }
  if (pop >= 1_000) {
    return `${(pop / 1_000).toFixed(0)}K`;
  }
  return pop.toString();
}

/**
 * Floating widget displaying selection count and exception action buttons.
 * Appears in the top-left corner of the map when districts are selected.
 */
export function SelectionWidget({
  selectionCount,
  totalPopulation = 0,
  onSetAsExceptions,
  onClearSelection,
  hasRules = true,
}: SelectionWidgetProps) {
  // Don't render if no districts are selected
  if (selectionCount === 0) {
    return null;
  }

  const districtLabel = selectionCount === 1 ? "district" : "districts";
  const populationText = totalPopulation > 0 ? ` | ${formatPopulation(totalPopulation)} pop.` : "";

  return (
    <div
      className="absolute top-3 left-3 z-10 bg-accent backdrop-blur-sm rounded-lg shadow-md px-3 py-2"
      role="region"
      aria-label="District selection"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-white">
          {selectionCount} {districtLabel} selected{populationText}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSetAsExceptions}
          disabled={!hasRules}
          title={!hasRules ? "No rules defined" : undefined}
          className="h-7 px-3 text-xs text-white hover:text-white hover:bg-white/20 disabled:text-white/50"
        >
          Add exception
        </Button>
        <button
          onClick={onClearSelection}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
