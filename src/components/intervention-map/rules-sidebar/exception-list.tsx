"use client";

import { X } from "lucide-react";

interface ExceptionListProps {
  /** Array of district IDs that are excluded from the rule */
  excludedDistrictIds: string[];
  /** Function to look up district name by ID */
  getDistrictName: (districtId: string) => string;
  /** Callback when a district is removed from exceptions */
  onRemove: (districtId: string) => void;
}

/**
 * Displays a list of districts excluded from a rule's selection criteria.
 * Shows an empty state message when no exceptions exist.
 * Each exception item shows a remove icon on hover.
 */
export function ExceptionList({
  excludedDistrictIds,
  getDistrictName,
  onRemove,
}: ExceptionListProps) {
  if (excludedDistrictIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No exceptions. All matching districts will be included.
      </p>
    );
  }

  return (
    <ul role="list" className="space-y-1">
      {excludedDistrictIds.map((districtId) => (
        <li
          key={districtId}
          role="listitem"
          className="group flex items-center justify-between py-1 px-2 -mx-2 rounded hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Delete" || e.key === "Backspace") {
              e.preventDefault();
              onRemove(districtId);
            }
          }}
        >
          <span className="text-sm text-muted-foreground">
            {getDistrictName(districtId)}
          </span>
          <button
            type="button"
            onClick={() => onRemove(districtId)}
            className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-opacity"
            aria-label={`Remove ${getDistrictName(districtId)} from exceptions`}
          >
            <X className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
