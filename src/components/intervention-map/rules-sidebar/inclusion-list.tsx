"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InclusionEntry } from "@/types/rule";

interface InclusionListProps {
  /** List of inclusion entries to display */
  entries: InclusionEntry[];
  /** Callback when an entry is removed */
  onRemove: (entryId: string, level: InclusionEntry["level"]) => void;
}

/**
 * Displays a list of inclusion entries (regions or districts).
 * Each entry shows the name and level, with a remove button.
 */
export function InclusionList({ entries, onRemove }: InclusionListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No inclusions added
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => (
        <div
          key={`${entry.level}-${entry.id}`}
          className="flex items-center justify-between gap-2 py-1 px-2 rounded bg-muted/50 group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm truncate">{entry.name}</span>
            {entry.level === "region" && (
              <span className="text-xs text-muted-foreground shrink-0">
                ({entry.districtIds.length} districts)
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(entry.id, entry.level)}
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
