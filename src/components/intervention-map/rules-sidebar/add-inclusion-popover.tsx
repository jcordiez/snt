"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DistrictProperties } from "@/data/districts";
import type { InclusionEntry } from "@/types/rule";

type OrgUnitLevel = "region" | "district";

interface OrgUnitOption {
  id: string;
  name: string;
  level: OrgUnitLevel;
  /** For provinces: the region they belong to */
  parentId?: string;
  /** All district IDs that would be included */
  districtIds: string[];
}

interface AddInclusionPopoverProps {
  /** All districts data */
  districts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null;
  /** Existing inclusion entries */
  inclusionEntries: InclusionEntry[];
  /** Callback when an inclusion entry is added */
  onAddInclusion: (entry: InclusionEntry) => void;
  /** Optional custom trigger element */
  trigger?: React.ReactNode;
}

/**
 * Popover component for adding districts, provinces, or regions to the inclusions list.
 * Displays a searchable list grouped by level: regions, provinces, districts.
 * Selecting a region or province adds all its child districts.
 */
export function AddInclusionPopover({
  districts,
  inclusionEntries,
  onAddInclusion,
  trigger,
}: AddInclusionPopoverProps) {
  // Compute all included district IDs from entries
  const includedDistrictIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of inclusionEntries) {
      for (const id of entry.districtIds) {
        ids.add(id);
      }
    }
    return ids;
  }, [inclusionEntries]);

  // Track which entries already exist (by id and level)
  const existingEntryKeys = useMemo(() => {
    return new Set(inclusionEntries.map((e) => `${e.level}:${e.id}`));
  }, [inclusionEntries]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Build hierarchical data from districts
  const { allOptions, regionOptions, districtOptions } = useMemo(() => {
    if (!districts?.features) {
      return { allOptions: [], regionOptions: [], districtOptions: [] };
    }

    // Extract unique regions
    const regionMap = new Map<string, { name: string; districtIds: string[] }>();
    const districtOpts: OrgUnitOption[] = [];

    for (const feature of districts.features) {
      const { districtId, districtName, regionId, regionName } = feature.properties;

      // Add district
      districtOpts.push({
        id: districtId,
        name: districtName,
        level: "district",
        parentId: regionId,
        districtIds: [districtId],
      });

      // Track region
      if (!regionMap.has(regionId)) {
        regionMap.set(regionId, { name: regionName, districtIds: [] });
      }
      regionMap.get(regionId)!.districtIds.push(districtId);
    }

    // Build region options
    const regionOpts: OrgUnitOption[] = Array.from(regionMap.entries())
      .map(([id, { name, districtIds }]) => ({
        id,
        name,
        level: "region" as OrgUnitLevel,
        districtIds,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Sort districts
    districtOpts.sort((a, b) => a.name.localeCompare(b.name));

    return {
      allOptions: [...regionOpts, ...districtOpts],
      regionOptions: regionOpts,
      districtOptions: districtOpts,
    };
  }, [districts]);

  // Filter options based on search query and group by level
  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // Filter each group
    const filterByQuery = (options: OrgUnitOption[]) => {
      if (!query) return options;
      return options.filter((opt) => opt.name.toLowerCase().includes(query));
    };

    // Filter out options that are already added as entries
    const filterByNotAlreadyAdded = (options: OrgUnitOption[]) => {
      return options.filter((opt) => {
        // Check if this exact entry already exists
        const entryKey = `${opt.level}:${opt.id}`;
        return !existingEntryKeys.has(entryKey);
      });
    };

    const regions = filterByNotAlreadyAdded(filterByQuery(regionOptions));
    const filteredDistricts = filterByNotAlreadyAdded(filterByQuery(districtOptions));

    return {
      regions,
      districts: filteredDistricts,
    };
  }, [searchQuery, regionOptions, districtOptions, existingEntryKeys]);

  // Flat list of all filtered items for keyboard navigation
  const flatFilteredItems = useMemo(() => {
    return [...filteredGroups.regions, ...filteredGroups.districts];
  }, [filteredGroups]);

  const handleSelect = useCallback((option: OrgUnitOption) => {
    // Create an inclusion entry from the option
    const entry: InclusionEntry = {
      id: option.id,
      name: option.name,
      level: option.level,
      districtIds: option.districtIds,
    };

    onAddInclusion(entry);

    setOpen(false);
    setSearchQuery("");
    setActiveIndex(-1);
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, [onAddInclusion]);

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
        if (flatFilteredItems.length > 0) {
          setActiveIndex(0);
          items?.[0]?.focus();
        }
        break;
      case "Enter":
        e.preventDefault();
        if (flatFilteredItems.length > 0) {
          handleSelect(flatFilteredItems[0]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
    }
  }, [flatFilteredItems, handleSelect]);

  const handleOptionKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLButtonElement>,
    option: OrgUnitOption,
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
          setActiveIndex(-1);
          inputRef.current?.focus();
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        handleSelect(option);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
    }
  }, [handleSelect]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setActiveIndex(-1);
  };

  const hasResults = filteredGroups.regions.length > 0 || filteredGroups.districts.length > 0;
  let itemIndex = -1;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className="h-6 w-6"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0"
        align="end"
        onEscapeKeyDown={() => {
          triggerRef.current?.focus();
        }}
      >
        <div className="p-2 border-b">
          <Input
            ref={inputRef}
            placeholder="Search regions or districts..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleInputKeyDown}
            className="h-8"
            autoFocus
            aria-label="Search regions or districts"
            aria-controls="inclusion-listbox"
            aria-activedescendant={activeIndex >= 0 ? `inclusion-option-${activeIndex}` : undefined}
          />
        </div>
        {!hasResults ? (
          <p className="p-4 text-sm text-muted-foreground text-center">
            {searchQuery
              ? "No results match your search"
              : "All districts are already included"}
          </p>
        ) : (
          <div
            ref={listRef}
            className="max-h-[300px] overflow-y-auto p-1"
            role="listbox"
            aria-label="Available regions and districts"
          >
            {/* Regions group */}
            {filteredGroups.regions.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Regions
                </div>
                {filteredGroups.regions.map((option) => {
                  itemIndex++;
                  const currentIndex = itemIndex;
                  const districtCount = option.districtIds.length;
                  return (
                    <button
                      key={`region-${option.id}`}
                      id={`inclusion-option-${currentIndex}`}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === currentIndex}
                      onClick={() => handleSelect(option)}
                      onKeyDown={(e) => handleOptionKeyDown(e, option, currentIndex)}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted focus:bg-muted focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-between"
                    >
                      <span className="font-medium">{option.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {districtCount} district{districtCount !== 1 ? "s" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Districts group */}
            {filteredGroups.districts.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Districts
                </div>
                {filteredGroups.districts.map((option) => {
                  itemIndex++;
                  const currentIndex = itemIndex;
                  return (
                    <button
                      key={`district-${option.id}`}
                      id={`inclusion-option-${currentIndex}`}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === currentIndex}
                      onClick={() => handleSelect(option)}
                      onKeyDown={(e) => handleOptionKeyDown(e, option, currentIndex)}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted focus:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
