"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Threshold for enabling virtualization (to avoid overhead for small lists)
const VIRTUALIZATION_THRESHOLD = 100;
const ITEM_HEIGHT = 36; // Height of each option in pixels

interface DistrictOption {
  id: string;
  name: string;
}

interface AddExceptionPopoverProps {
  /** Districts that match the current rule criteria */
  matchingDistricts: DistrictOption[];
  /** District IDs already in the exceptions list */
  excludedDistrictIds: string[];
  /** Callback when a district is selected to add as exception */
  onAddException: (districtId: string) => void;
  /** Optional custom trigger element */
  trigger?: React.ReactNode;
}

/**
 * Virtualized list component for rendering large district lists efficiently.
 * Only renders items that are visible in the viewport.
 */
function VirtualizedDistrictList({
  districts,
  activeIndex,
  onSelect,
  onKeyDown,
  listRef,
}: {
  districts: DistrictOption[];
  activeIndex: number;
  onSelect: (districtId: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>, district: DistrictOption, index: number) => void;
  listRef: React.MutableRefObject<HTMLUListElement | null>;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: districts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5, // Render 5 extra items above and below viewport
  });

  // Callback ref to assign the ul element to the parent's ref
  const setListRef = useCallback((node: HTMLUListElement | null) => {
    listRef.current = node;
  }, [listRef]);

  return (
    <div
      ref={parentRef}
      className="max-h-[300px] overflow-y-auto"
    >
      <ul
        ref={setListRef}
        id="district-listbox"
        role="listbox"
        aria-label="Available districts"
        className="p-1 relative"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const district = districts[virtualItem.index];
          return (
            <li
              key={district.id}
              className="absolute w-full px-1"
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <button
                id={`district-option-${virtualItem.index}`}
                type="button"
                role="option"
                aria-selected={activeIndex === virtualItem.index}
                onClick={() => onSelect(district.id)}
                onKeyDown={(e) => onKeyDown(e, district, virtualItem.index)}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted focus:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {district.name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Popover component for adding districts to the exceptions list.
 * Displays a searchable list of districts that match the current rule criteria,
 * excluding those already in the exceptions list.
 * Supports keyboard navigation: Arrow keys in search input move to list,
 * Enter/Space to select, Escape to close.
 * Uses virtualization for large lists (100+ items) to maintain performance.
 */
export function AddExceptionPopover({
  matchingDistricts,
  excludedDistrictIds,
  onAddException,
  trigger,
}: AddExceptionPopoverProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Determine if virtualization should be used
  const useVirtualization = useMemo(
    () => matchingDistricts.length >= VIRTUALIZATION_THRESHOLD,
    [matchingDistricts.length]
  );

  // Filter out already excluded districts
  const availableDistricts = useMemo(() => {
    return matchingDistricts.filter(
      (district) => !excludedDistrictIds.includes(district.id)
    );
  }, [matchingDistricts, excludedDistrictIds]);

  // Filter by search query
  const filteredDistricts = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableDistricts;
    }
    const query = searchQuery.toLowerCase();
    return availableDistricts.filter((district) =>
      district.name.toLowerCase().includes(query)
    );
  }, [availableDistricts, searchQuery]);

  const handleSelect = useCallback((districtId: string) => {
    onAddException(districtId);
    setOpen(false);
    setSearchQuery("");
    setActiveIndex(-1);
    // Return focus to trigger button after popover closes
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, [onAddException]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
      setActiveIndex(-1);
    }
  };

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (filteredDistricts.length > 0) {
          setActiveIndex(0);
          items?.[0]?.focus();
        }
        break;
      case "Enter":
        e.preventDefault();
        if (filteredDistricts.length > 0) {
          handleSelect(filteredDistricts[0].id);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
    }
  }, [filteredDistricts, handleSelect]);

  const handleOptionKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLButtonElement>,
    district: DistrictOption,
    index: number
  ) => {
    const items = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
    if (!items) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (index < items.length - 1) {
          setActiveIndex(index + 1);
          items[index + 1]?.focus();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (index > 0) {
          setActiveIndex(index - 1);
          items[index - 1]?.focus();
        } else {
          // Move back to search input
          setActiveIndex(-1);
          inputRef.current?.focus();
        }
        break;
      case "Enter":
      case " ": // Space
        e.preventDefault();
        handleSelect(district.id);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        items[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(items.length - 1);
        items[items.length - 1]?.focus();
        break;
    }
  }, [handleSelect]);

  // Reset activeIndex when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setActiveIndex(-1);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            ref={triggerRef}
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={availableDistricts.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Exception
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0"
        align="start"
        onEscapeKeyDown={() => {
          triggerRef.current?.focus();
        }}
      >
        <div className="p-2 border-b">
          <Input
            ref={inputRef}
            placeholder="Search districts..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleInputKeyDown}
            className="h-8"
            autoFocus
            aria-label="Search districts"
            aria-controls="district-listbox"
            aria-activedescendant={activeIndex >= 0 ? `district-option-${activeIndex}` : undefined}
          />
        </div>
        {filteredDistricts.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">
            {matchingDistricts.length === 0
              ? "No districts match the current criteria"
              : searchQuery
                ? "No districts match your search"
                : "All matching districts are already excluded"}
          </p>
        ) : useVirtualization ? (
          <VirtualizedDistrictList
            districts={filteredDistricts}
            activeIndex={activeIndex}
            onSelect={handleSelect}
            onKeyDown={handleOptionKeyDown}
            listRef={listRef}
          />
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            <ul
              ref={listRef}
              id="district-listbox"
              role="listbox"
              aria-label="Available districts"
              className="p-1"
            >
              {filteredDistricts.map((district, index) => (
                <li key={district.id}>
                  <button
                    id={`district-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    onClick={() => handleSelect(district.id)}
                    onKeyDown={(e) => handleOptionKeyDown(e, district, index)}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted focus:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {district.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
