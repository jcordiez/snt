"use client";

import { Button } from "@/components/ui/button";

interface SelectionWidgetProps {
  /** Number of selected districts */
  selectionCount: number;
  /** Callback when "Set as exceptions" is clicked */
  onSetAsExceptions: () => void;
  /** Callback when "Remove from exceptions" is clicked */
  onRemoveFromExceptions: () => void;
  /** Whether rules exist (buttons disabled if no rules) */
  hasRules?: boolean;
}

/**
 * Floating widget displaying selection count and exception action buttons.
 * Appears in the top-left corner of the map when districts are selected.
 */
export function SelectionWidget({
  selectionCount,
  onSetAsExceptions,
  onRemoveFromExceptions,
  hasRules = true,
}: SelectionWidgetProps) {
  // Don't render if no districts are selected
  if (selectionCount === 0) {
    return null;
  }

  const districtLabel = selectionCount === 1 ? "district" : "districts";

  return (
    <div
      className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md px-4 py-3 max-w-[320px]"
      role="region"
      aria-label="District selection"
      aria-live="polite"
    >
      <div className="text-sm text-foreground mb-2">
        {selectionCount} {districtLabel} selected
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSetAsExceptions}
          disabled={!hasRules}
          title={!hasRules ? "No rules defined" : undefined}
        >
          Set as exceptions
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRemoveFromExceptions}
          disabled={!hasRules}
          title={!hasRules ? "No rules defined" : undefined}
        >
          Remove from exceptions
        </Button>
      </div>
    </div>
  );
}
