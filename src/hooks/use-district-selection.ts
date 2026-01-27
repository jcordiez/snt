"use client";

import { useState, useCallback, useEffect } from "react";

export interface UseDistrictSelectionReturn {
  /** Set of currently selected district IDs */
  selectedDistrictIds: Set<string>;
  /** Select a district - if shiftKey is true, toggle in selection; otherwise replace selection */
  selectDistrict: (districtId: string, shiftKey: boolean) => void;
  /** Clear all selected districts */
  clearSelection: () => void;
  /** Check if a district is selected */
  isSelected: (districtId: string) => boolean;
  /** Number of selected districts */
  selectionCount: number;
}

export interface UseDistrictSelectionOptions {
  /** Set of district IDs that are currently active/selectable (e.g., districts in selected province) */
  activeDistrictIds?: Set<string>;
}

/**
 * Hook for managing district selection state on the map.
 * Supports single-click (replace selection) and Shift+click (toggle in selection).
 * When activeDistrictIds changes, any selected districts not in the active set are removed.
 */
export function useDistrictSelection(options?: UseDistrictSelectionOptions): UseDistrictSelectionReturn {
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<Set<string>>(new Set());
  const { activeDistrictIds } = options ?? {};

  // When active districts change, remove any selected districts that are no longer active
  useEffect(() => {
    if (!activeDistrictIds) return; // If no filter provided, allow all districts

    setSelectedDistrictIds((prevSelection) => {
      const filtered = new Set<string>();
      prevSelection.forEach((id) => {
        if (activeDistrictIds.has(id)) {
          filtered.add(id);
        }
      });
      // Only update if the set actually changed
      if (filtered.size === prevSelection.size) {
        return prevSelection;
      }
      return filtered;
    });
  }, [activeDistrictIds]);

  const selectDistrict = useCallback((districtId: string, shiftKey: boolean) => {
    setSelectedDistrictIds((prevSelection) => {
      if (shiftKey) {
        // Shift+click: toggle the district in the selection
        const newSelection = new Set(prevSelection);
        if (newSelection.has(districtId)) {
          newSelection.delete(districtId);
        } else {
          newSelection.add(districtId);
        }
        return newSelection;
      } else {
        // Regular click: replace selection with just this district
        return new Set([districtId]);
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDistrictIds(new Set());
  }, []);

  const isSelected = useCallback(
    (districtId: string) => selectedDistrictIds.has(districtId),
    [selectedDistrictIds]
  );

  return {
    selectedDistrictIds,
    selectDistrict,
    clearSelection,
    isSelected,
    selectionCount: selectedDistrictIds.size,
  };
}
