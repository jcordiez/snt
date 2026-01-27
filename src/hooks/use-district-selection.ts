"use client";

import { useState, useCallback } from "react";

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

/**
 * Hook for managing district selection state on the map.
 * Supports single-click (replace selection) and Shift+click (toggle in selection).
 */
export function useDistrictSelection(): UseDistrictSelectionReturn {
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<Set<string>>(new Set());

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
