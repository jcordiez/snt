"use client";

import { useState } from "react";
import { Search, X, Plus, ChevronDown, ChevronRight, Info, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMetricTypes } from "@/hooks/use-metric-types";

export default function LayersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );
  const { groupedByCategory, isLoading } = useMetricTypes();

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Filter layers by search query
  const filteredGroupedByCategory = Object.entries(groupedByCategory).reduce<
    Record<string, typeof groupedByCategory[string]>
  >((acc, [category, metrics]) => {
    const filteredMetrics = metrics.filter((metric) =>
      metric.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredMetrics.length > 0) {
      acc[category] = filteredMetrics;
    }
    return acc;
  }, {});

  const categories = Object.keys(filteredGroupedByCategory).sort();

  return (
    <div className="flex flex-col h-full p-6">
      <h1 className="text-2xl font-semibold">Available metrics</h1>

      <div className="flex items-center gap-4 mt-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button className="ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create layer
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          <div className="text-muted-foreground">Loading layers...</div>
        ) : categories.length === 0 ? (
          <div className="text-muted-foreground">No layers found</div>
        ) : (
          categories.map((category) => {
            const isCollapsed = collapsedCategories.has(category);
            const metrics = filteredGroupedByCategory[category];

            return (
              <div key={category} className="border rounded-lg">
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-semibold">{category}</span>
                  <span className="text-muted-foreground text-sm">
                    ({metrics.length})
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="border-t">
                    {metrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="flex items-center px-4 py-2 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                      >
                        <button className="p-1 rounded hover:bg-muted mr-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <span className="flex-1">{metric.name}</span>
                        <span className="text-sm text-muted-foreground mr-4">Source</span>
                        <button className="p-1 rounded hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
