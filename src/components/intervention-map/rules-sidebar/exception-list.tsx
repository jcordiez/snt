"use client";

import { useRef, useCallback } from "react";
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
 * Supports keyboard navigation: Arrow keys to move, Enter/Space/Delete/Backspace to remove.
 */
export function ExceptionList({
  excludedDistrictIds,
  getDistrictName,
  onRemove,
}: ExceptionListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLLIElement>, districtId: string, index: number) => {
      const items = listRef.current?.querySelectorAll<HTMLLIElement>('[role="listitem"]');
      if (!items) return;

      switch (e.key) {
        case "Delete":
        case "Backspace":
        case "Enter":
        case " ": // Space
          e.preventDefault();
          onRemove(districtId);
          // Focus next item, or previous if removing last item
          requestAnimationFrame(() => {
            const newItems = listRef.current?.querySelectorAll<HTMLLIElement>('[role="listitem"]');
            if (newItems && newItems.length > 0) {
              const focusIndex = index >= newItems.length ? newItems.length - 1 : index;
              newItems[focusIndex]?.focus();
            }
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          if (index < items.length - 1) {
            items[index + 1]?.focus();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (index > 0) {
            items[index - 1]?.focus();
          }
          break;
        case "Home":
          e.preventDefault();
          items[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          items[items.length - 1]?.focus();
          break;
      }
    },
    [onRemove]
  );

  if (excludedDistrictIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No exceptions. All matching districts will be included.
      </p>
    );
  }

  return (
    <ul
      ref={listRef}
      role="list"
      aria-label="Excluded districts"
      className="space-y-1"
    >
      {excludedDistrictIds.map((districtId, index) => {
        const districtName = getDistrictName(districtId);
        return (
          <li
            key={districtId}
            role="listitem"
            aria-label={`${districtName}, press Enter, Space, Delete or Backspace to remove`}
            className="group flex items-center justify-between py-1 px-2 -mx-2 rounded hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, districtId, index)}
          >
            <span className="text-sm text-muted-foreground">
              {districtName}
            </span>
            <button
              type="button"
              onClick={() => onRemove(districtId)}
              tabIndex={-1}
              className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-opacity"
              aria-label={`Remove ${districtName} from exceptions`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
