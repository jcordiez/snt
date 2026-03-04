"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, ChevronDown, ChevronRight, Eye, EyeOff, MoreHorizontal, Pencil, Trash2, Layers, Check, Ban, Filter, Pin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMetricTypes } from "@/hooks/use-metric-types";
import { useMetricValues } from "@/hooks/use-metric-values";
import { useOrgUnits } from "@/hooks/use-orgunits";
import { Map, MapControls, useMap } from "@/components/ui/map";
import { countryConfig } from "@/data/districts";
import maplibregl from "maplibre-gl";
import { TooltipProvider } from "@/components/ui/tooltip";
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

// Default color scale for metric visualization (green to red, 6 steps)
const DEFAULT_COLOR_SCALE = [
  "#22c55e", // green-500 (low)
  "#84cc16", // lime-500
  "#eab308", // yellow-500
  "#f97316", // orange-500
  "#ef4444", // red-500
  "#dc2626", // red-600 (high)
];

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
  // Scale definition - 5 threshold values for 6 color buckets
  const [thresholds, setThresholds] = useState<string[]>(["", "", "", "", ""]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (metric) {
        setName(metric.name);
        setDescription(metric.description || "");
        setCategory(metric.category || "");
        setSource(metric.source || "");
        setUnits(metric.units || "");
        setUnitSymbol(metric.unit_symbol || "");
        // Parse existing thresholds from domain (skip first and last which are min/max)
        const domain = metric.legend_config?.domain || [];
        if (domain.length >= 2) {
          // Domain includes min and max, thresholds are the values in between
          const innerThresholds = domain.slice(1, -1);
          setThresholds(
            Array.from({ length: 5 }, (_, i) =>
              innerThresholds[i] !== undefined ? String(innerThresholds[i]) : ""
            )
          );
        } else {
          setThresholds(["", "", "", "", ""]);
        }
      } else {
        // Create mode - reset to empty values
        setName("");
        setDescription("");
        setCategory("");
        setSource("");
        setUnits("");
        setUnitSymbol("");
        setThresholds(["", "", "", "", ""]);
      }
    }
  }, [isOpen, metric]);

  const handleThresholdChange = (index: number, value: string) => {
    const newThresholds = [...thresholds];
    newThresholds[index] = value;
    setThresholds(newThresholds);
  };

  const handleSave = () => {
    // Parse thresholds to numbers, filter out empty ones
    const parsedThresholds = thresholds
      .map(t => t.trim())
      .filter(t => t !== "")
      .map(t => parseFloat(t))
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);

    // Build domain array: [0, ...thresholds, max]
    // For now, use 0 and 100 as default min/max if no thresholds defined
    const domain = parsedThresholds.length > 0
      ? [0, ...parsedThresholds, Math.max(...parsedThresholds) * 1.5]
      : [0, 100];

    const metricData: MetricType = metric
      ? {
          ...metric,
          name: name.trim(),
          description: description.trim(),
          category: category.trim(),
          source: source.trim(),
          units: units.trim(),
          unit_symbol: unitSymbol.trim(),
          legend_config: {
            domain,
            range: DEFAULT_COLOR_SCALE.slice(0, parsedThresholds.length + 1),
          },
        }
      : {
          id: 0,
          account: 0,
          name: name.trim(),
          description: description.trim(),
          category: category.trim() || "Other",
          source: source.trim(),
          units: units.trim(),
          unit_symbol: unitSymbol.trim(),
          comments: "",
          legend_config: {
            domain,
            range: DEFAULT_COLOR_SCALE.slice(0, parsedThresholds.length + 1),
          },
          legend_type: "threshold",
          created_at: "",
          updated_at: "",
        };

    onSave(metricData);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const isCreateMode = !metric;
  const canSave = name.trim() !== "";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isCreateMode ? "Create Layer" : "Edit Layer"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
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

          {/* Scale Definition Section */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Scale Thresholds</label>
              <span className="text-xs text-muted-foreground">Define color breakpoints</span>
            </div>

            <div className="space-y-2">
              {thresholds.map((threshold, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: DEFAULT_COLOR_SCALE[index] }}
                  />
                  <span className="text-xs text-muted-foreground w-6">&lt;</span>
                  <Input
                    type="number"
                    value={threshold}
                    onChange={(e) => handleThresholdChange(index, e.target.value)}
                    placeholder={`Threshold ${index + 1}`}
                    className="flex-1"
                  />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: DEFAULT_COLOR_SCALE[5] }}
                />
                <span className="text-xs text-muted-foreground">≥ last threshold</span>
              </div>
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

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  metric: MetricType | null;
  onConfirm: () => void;
}

function DeleteConfirmDialog({ isOpen, onOpenChange, metric, onConfirm }: DeleteConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Layer</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete &quot;{metric?.name}&quot;? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Map layer component for displaying metric values
const SOURCE_ID = "metric-districts";
const FILL_LAYER_ID = "metric-district-fills";
const BORDER_LAYER_ID = "metric-district-borders";

interface MetricMapLayerProps {
  districts: GeoJSON.FeatureCollection | null;
  valuesByOrgUnit: Record<number, number>;
  metricType: MetricType | null;
  min: number | null;
  max: number | null;
}

function MetricMapLayer({ districts, valuesByOrgUnit, metricType, min, max }: MetricMapLayerProps) {
  const { map, isLoaded } = useMap();
  const layersAdded = useMemo(() => ({ current: false }), []);
  const popupRef = useMemo(() => ({ current: null as maplibregl.Popup | null }), []);

  // Build color expression based on thresholds
  const colorExpression = useMemo(() => {
    if (!metricType?.legend_config?.domain || min === null || max === null) {
      return "#d1d5db"; // gray-300 fallback
    }

    const domain = metricType.legend_config.domain;
    const colors = metricType.legend_config.range?.length > 0
      ? metricType.legend_config.range
      : DEFAULT_COLOR_SCALE;

    // Build step expression
    if (domain.length >= 2 && colors.length >= 2) {
      const steps: unknown[] = ["step", ["get", "metricValue"], colors[0]];
      for (let i = 1; i < domain.length && i < colors.length; i++) {
        steps.push(domain[i], colors[i]);
      }
      return steps as maplibregl.ExpressionSpecification;
    }

    return "#d1d5db";
  }, [metricType, min, max]);

  // Enhance districts with metric values
  const enhancedDistricts = useMemo(() => {
    if (!districts) return null;

    return {
      ...districts,
      features: districts.features.map((feature: GeoJSON.Feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          metricValue: valuesByOrgUnit[feature.properties?.districtId] ?? 0,
        },
      })),
    };
  }, [districts, valuesByOrgUnit]);

  // Initialize layers
  useEffect(() => {
    if (!isLoaded || !map || !enhancedDistricts) return;

    // Clean up existing layers first
    try {
      if (map.getLayer(BORDER_LAYER_ID)) map.removeLayer(BORDER_LAYER_ID);
      if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    } catch { /* ignore */ }

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: enhancedDistricts,
    });

    map.addLayer({
      id: FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": colorExpression,
        "fill-opacity": 0.85,
      },
    });

    map.addLayer({
      id: BORDER_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#ffffff",
        "line-width": 1,
      },
    });

    layersAdded.current = true;
  }, [isLoaded, map, enhancedDistricts, colorExpression, layersAdded]);

  // Update data when values change
  useEffect(() => {
    if (!isLoaded || !map || !layersAdded.current || !enhancedDistricts) return;

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(enhancedDistricts);
    }

    if (map.getLayer(FILL_LAYER_ID)) {
      map.setPaintProperty(FILL_LAYER_ID, "fill-color", colorExpression);
    }
  }, [isLoaded, map, enhancedDistricts, colorExpression, layersAdded]);

  // Tooltip on hover
  useEffect(() => {
    if (!isLoaded || !map || !metricType) return;

    if (!popupRef.current) {
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
      });
    }

    const popup = popupRef.current;

    const handleMouseMove = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      const props = e.features[0].properties;
      const value = props.metricValue ?? 0;

      map.getCanvas().style.cursor = "pointer";
      popup
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family: system-ui, sans-serif; padding: 4px 0;">
            <strong style="font-size: 13px;">${props.districtName || "Unknown"}</strong>
            <div style="margin-top: 4px; font-size: 12px;">
              <span style="color: #666;">${metricType.name}:</span>
              <span style="font-weight: 600; margin-left: 4px;">${value.toFixed(2)}${metricType.unit_symbol ? ` ${metricType.unit_symbol}` : ""}</span>
            </div>
          </div>
        `)
        .addTo(map);
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    };

    map.on("mousemove", FILL_LAYER_ID, handleMouseMove);
    map.on("mouseleave", FILL_LAYER_ID, handleMouseLeave);

    return () => {
      map.off("mousemove", FILL_LAYER_ID, handleMouseMove);
      map.off("mouseleave", FILL_LAYER_ID, handleMouseLeave);
      popup.remove();
    };
  }, [isLoaded, map, metricType, popupRef]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (!map) return;
      try {
        if (map.getLayer(BORDER_LAYER_ID)) map.removeLayer(BORDER_LAYER_ID);
        if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch { /* ignore */ }
    };
  }, [map]);

  return null;
}

// Scale legend component
function ScaleLegend({ metricType, min, max }: { metricType: MetricType | null; min: number | null; max: number | null }) {
  if (!metricType) return null;

  const domain = metricType.legend_config?.domain || [];
  const colors = metricType.legend_config?.range?.length > 0
    ? metricType.legend_config.range
    : DEFAULT_COLOR_SCALE;

  return (
    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2">
      <div className="text-xs font-semibold text-gray-700 mb-2">
        {metricType.name}
        {metricType.unit_symbol && <span className="font-normal text-gray-500 ml-1">({metricType.unit_symbol})</span>}
      </div>

      <div className="flex h-3 rounded-sm overflow-hidden mb-1 w-32">
        {colors.slice(0, 6).map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-gray-600 w-32">
        <span>{min !== null ? min.toFixed(0) : "0"}</span>
        <span>{max !== null ? max.toFixed(0) : "100"}</span>
      </div>
    </div>
  );
}

export default function LayersPage() {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<MetricType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMetric, setDeletingMetric] = useState<MetricType | null>(null);
  const [selectedMetricId, setSelectedMetricId] = useState<number | null>(null);
  const [hiddenLayerIds, setHiddenLayerIds] = useState<Set<number>>(new Set());
  const [excludedLayerIds, setExcludedLayerIds] = useState<Set<number>>(new Set());
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const { groupedByCategory, isLoading: isLoadingMetrics, addMetric, data: metricTypes } = useMetricTypes();

  // Toggle layer visibility
  const toggleLayerVisibility = (metricId: number) => {
    setHiddenLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(metricId)) {
        next.delete(metricId);
      } else {
        next.add(metricId);
      }
      return next;
    });
  };

  // Toggle layer availability (include/exclude from available layers)
  const toggleLayerAvailability = (metricId: number) => {
    setExcludedLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(metricId)) {
        next.delete(metricId);
      } else {
        next.add(metricId);
      }
      return next;
    });
  };
  const { data: districts } = useOrgUnits();
  const { valuesByOrgUnit, min, max, isLoading: isLoadingValues } = useMetricValues(selectedMetricId);

  // Get the selected metric type object
  const selectedMetricType = useMemo((): MetricType | null => {
    if (!selectedMetricId || !metricTypes) return null;
    return metricTypes.find((m: MetricType) => m.id === selectedMetricId) || null;
  }, [selectedMetricId, metricTypes]);

  const handleEditLayer = (metric: MetricType) => {
    setEditingMetric(metric);
    setEditModalOpen(true);
  };

  const handleSaveLayer = (metricData: MetricType) => {
    if (editingMetric === null) {
      const newMetric = addMetric({
        account: metricData.account,
        name: metricData.name,
        description: metricData.description,
        category: metricData.category,
        source: metricData.source,
        units: metricData.units,
        unit_symbol: metricData.unit_symbol,
        comments: metricData.comments,
        legend_config: metricData.legend_config,
        legend_type: metricData.legend_type,
      });
      console.log("Created layer:", newMetric);
    } else {
      console.log("Saving layer:", metricData);
    }
    setEditingMetric(null);
  };

  const handleCreateLayer = () => {
    setEditingMetric(null);
    setEditModalOpen(true);
  };

  const handleDeleteLayer = (metric: MetricType) => {
    setDeletingMetric(metric);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    console.log("Deleting layer:", deletingMetric);
    setDeletingMetric(null);
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

  const handleSelectLayer = (metric: MetricType) => {
    setSelectedMetricId(selectedMetricId === metric.id ? null : metric.id);
  };

  // Filter layers by active status
  const filteredGroupedByCategory = Object.entries(groupedByCategory).reduce<
    Record<string, typeof groupedByCategory[string]>
  >((acc, [category, metrics]) => {
    const filteredMetrics = metrics.filter((metric) => {
      return !showActiveOnly || !excludedLayerIds.has(metric.id);
    });
    if (filteredMetrics.length > 0) {
      acc[category] = filteredMetrics;
    }
    return acc;
  }, {});

  const categories = Object.keys(filteredGroupedByCategory).sort();

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="px-6 py-4 border-b bg-white flex items-center justify-between">
        <h1 className="text-xl ml-12">Manage data</h1>
        
      </header>

        {/* Main Content - 2 Column Layout */}
        <main className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
          {/* Left Column - Layer List */}
          <div className="w-96 shrink-0 bg-white rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E3E8EF] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/20">
                  <Layers className="w-4 h-4 text-accent" />
                </div>
                <h2 className="text-lg font-medium text-primary">Available metrics</h2>
              </div>
              <div className="flex items-center gap-1">
                {/*<Button
                  variant={showActiveOnly ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setShowActiveOnly(!showActiveOnly)}
                  title={showActiveOnly ? "Showing active layers only" : "Show all layers"}
                >
                  <Pin className="h-4 w-4" />
                </Button>
                */}<Button variant="outline" size="icon" onClick={handleCreateLayer}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Layer List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMetrics ? (
                <div className="text-muted-foreground">Loading layers...</div>
              ) : categories.length === 0 ? (
                <div className="text-muted-foreground">No layers found</div>
              ) : (
                categories.map((category) => {
                  const isCollapsed = collapsedCategories.has(category);
                  const metrics = filteredGroupedByCategory[category];

                  return (
                    <div key={category}>
                      <div
                        className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                      >
                    
                        <span className="font-semibold">{category}</span>
          
                      </div>

                      {!isCollapsed && (
                        <div className="border-t">
                          {metrics.map((metric) => {
                            const isHidden = hiddenLayerIds.has(metric.id);
                            const isExcluded = excludedLayerIds.has(metric.id);
                            return (
                            <div
                              key={metric.id}
                              onClick={() => handleSelectLayer(metric)}
                              className={`group flex items-center px-4 py-2 cursor-pointer transition-colors border-b last:border-b-0 ${
                                selectedMetricId === metric.id
                                  ? "bg-accent/10 "
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              <span className={`flex-1 ${isExcluded ? "opacity-30 " : ""}`}>
                                {metric.name}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => toggleLayerAvailability(metric.id)}>
                                    {isExcluded ? (
                                      <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Include in available layers
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="h-4 w-4 mr-2" />
                                        Exclude from available layers
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditLayer(metric)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteLayer(metric)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl overflow-hidden">
            {/* Filter bar */}
            <div className="px-6 py-3 border-b flex items-center shrink-0">
              <span className="text-sm font-medium">
                {selectedMetricType ? selectedMetricType.name : "Map Preview"}
              </span>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative min-h-0">
              {selectedMetricId ? (
                <>
                  <Map center={countryConfig.center} zoom={countryConfig.zoom} theme="light">
                    <MetricMapLayer
                      districts={districts}
                      valuesByOrgUnit={valuesByOrgUnit}
                      metricType={selectedMetricType}
                      min={min}
                      max={max}
                    />
                    <MapControls position="bottom-right" showZoom={true} />
                  </Map>
                  <ScaleLegend metricType={selectedMetricType} min={min} max={max} />
                  {isLoadingValues && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                      <div className="text-muted-foreground">Loading data...</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a layer to view on the map</p>
                </div>
              </div>
            )}
            </div>
          </div>
        </main>
      </div>

      <LayerEditModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        metric={editingMetric}
        onSave={handleSaveLayer}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        metric={deletingMetric}
        onConfirm={handleConfirmDelete}
      />
    </TooltipProvider>
  );
}
