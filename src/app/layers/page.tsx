"use client";

import { useState, useEffect } from "react";
import { Search, X, Plus, ChevronDown, ChevronRight, Info, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMetricTypes } from "@/hooks/use-metric-types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { MetricType } from "@/types/intervention";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface LayerEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  metric: MetricType | null;
  onSave: (metric: MetricType) => void;
}

function LayerEditModal({ isOpen, onOpenChange, metric, onSave }: LayerEditModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [units, setUnits] = useState("");
  const [unitSymbol, setUnitSymbol] = useState("");

  // Reset form when modal opens with a metric
  useEffect(() => {
    if (isOpen && metric) {
      setName(metric.name);
      setDescription(metric.description || "");
      setCategory(metric.category || "");
      setSource(metric.source || "");
      setUnits(metric.units || "");
      setUnitSymbol(metric.unit_symbol || "");
    }
  }, [isOpen, metric]);

  const handleSave = () => {
    if (!metric) return;

    const updatedMetric: MetricType = {
      ...metric,
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      source: source.trim(),
      units: units.trim(),
      unit_symbol: unitSymbol.trim(),
    };

    onSave(updatedMetric);
    onOpenChange(false);
    // Reset form
    setName("");
    setDescription("");
    setCategory("");
    setSource("");
    setUnits("");
    setUnitSymbol("");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setName("");
    setDescription("");
    setCategory("");
    setSource("");
    setUnits("");
    setUnitSymbol("");
  };

  const canSave = name.trim() !== "";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Layer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="layer-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="layer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Layer name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="layer-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="layer-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Layer description"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="layer-category" className="text-sm font-medium">
              Category
            </label>
            <Input
              id="layer-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="layer-source" className="text-sm font-medium">
              Source
            </label>
            <Input
              id="layer-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Data source"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="layer-units" className="text-sm font-medium">
                Units
              </label>
              <Input
                id="layer-units"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="e.g., people"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="layer-unit-symbol" className="text-sm font-medium">
                Unit Symbol
              </label>
              <Input
                id="layer-unit-symbol"
                value={unitSymbol}
                onChange={(e) => setUnitSymbol(e.target.value)}
                placeholder="e.g., %"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LayerInfoTooltip({ metric }: { metric: MetricType }) {
  const hasUnits = metric.units || metric.unit_symbol;

  return (
    <div className="space-y-2 text-sm max-w-xs">
      <div>
        <div className="font-medium text-primary-foreground">{metric.name}</div>
        {metric.description && (
          <p className="text-primary-foreground/80 mt-1">{metric.description}</p>
        )}
      </div>
      <div className="space-y-1 text-primary-foreground/80">
        {metric.source && (
          <div>
            <span className="font-medium">Source:</span> {metric.source}
          </div>
        )}
        {hasUnits && (
          <div>
            <span className="font-medium">Units:</span>{" "}
            {metric.units}
            {metric.unit_symbol && ` (${metric.unit_symbol})`}
          </div>
        )}
        {metric.updated_at && (
          <div>
            <span className="font-medium">Last updated:</span>{" "}
            {formatDate(metric.updated_at)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LayersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<MetricType | null>(null);
  const { groupedByCategory, isLoading } = useMetricTypes();

  const handleEditLayer = (metric: MetricType) => {
    setEditingMetric(metric);
    setEditModalOpen(true);
  };

  const handleSaveLayer = (updatedMetric: MetricType) => {
    // TODO: Implement actual save to API
    console.log("Saving layer:", updatedMetric);
    setEditingMetric(null);
  };

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
    <TooltipProvider>
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="p-1 rounded hover:bg-muted mr-2">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="p-3">
                            <LayerInfoTooltip metric={metric} />
                          </TooltipContent>
                        </Tooltip>
                        <span className="flex-1">{metric.name}</span>
                        <span className="text-sm text-muted-foreground mr-4">Source</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditLayer(metric)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      <LayerEditModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        metric={editingMetric}
        onSave={handleSaveLayer}
      />
    </TooltipProvider>
  );
}
