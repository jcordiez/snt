"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
}

/**
 * Popover component for adding districts to the exceptions list.
 * Displays a searchable list of districts that match the current rule criteria,
 * excluding those already in the exceptions list.
 */
export function AddExceptionPopover({
  matchingDistricts,
  excludedDistrictIds,
  onAddException,
}: AddExceptionPopoverProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSelect = (districtId: string) => {
    onAddException(districtId);
    setOpen(false);
    setSearchQuery("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={availableDistricts.length === 0}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Exception
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0"
        align="start"
      >
        <div className="p-2 border-b">
          <Input
            placeholder="Search districts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredDistricts.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              {matchingDistricts.length === 0
                ? "No districts match the current criteria"
                : searchQuery
                  ? "No districts match your search"
                  : "All matching districts are already excluded"}
            </p>
          ) : (
            <ul role="listbox" className="p-1">
              {filteredDistricts.map((district) => (
                <li key={district.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => handleSelect(district.id)}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted focus:bg-muted focus:outline-none"
                  >
                    {district.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
