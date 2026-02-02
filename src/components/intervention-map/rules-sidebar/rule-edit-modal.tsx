"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ExceptionList } from "./exception-list";
import { AddExceptionPopover } from "./add-exception-popover";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { useDistrictRules } from "@/hooks/use-district-rules";
import type { DistrictProperties } from "@/data/districts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMetricValues } from "@/hooks/use-metric-values";
import type { MetricType, RuleOperator, InterventionCategory } from "@/types/intervention";
import type { SavedRule, RuleCriterion } from "@/types/rule";

function formatNumber(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

const OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: "<", label: "<" },
  { value: "<=", label: "<=" },
  { value: "=", label: "=" },
  { value: ">=", label: ">=" },
  { value: ">", label: ">" },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyCriterion(): RuleCriterion {
  return {
    id: generateId(),
    metricTypeId: null,
    operator: ">=",
    value: "",
  };
}

interface CriterionRowProps {
  criterion: RuleCriterion;
  metricTypes: MetricType[];
  onUpdate: (id: string, updates: Partial<RuleCriterion>) => void;
  onDelete: (id: string) => void;
}

function CriterionRow({
  criterion,
  metricTypes,
  onUpdate,
  onDelete,
}: CriterionRowProps) {
  const { min, max, isLoading } = useMetricValues(criterion.metricTypeId);
  const metricName = metricTypes.find((m) => m.id === criterion.metricTypeId)?.name ?? "Unknown";

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-sm font-medium text-muted-foreground w-[240px] shrink-0 truncate" title={metricName}>
        {metricName}
      </span>

      <Select
        value={criterion.operator}
        onValueChange={(value) => onUpdate(criterion.id, { operator: value as RuleOperator })}
      >
        <SelectTrigger className="w-[70px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="number"
        value={criterion.value}
        onChange={(e) => onUpdate(criterion.id, { value: e.target.value })}
        placeholder="Value"
        className="w-[100px]"
      />

      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 w-[120px] text-right">
        {criterion.metricTypeId !== null
          ? isLoading ? "..." : min !== null && max !== null ? `${formatNumber(min)} – ${formatNumber(max)}` : ""
          : ""}
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(criterion.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

const DEFAULT_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

// Default interventions for new rules (PRD Phase 7.1)
// CM (Case Management) - Category 37, Intervention 78
// Standard Pyrethroid Campaign - Category 40, Intervention 85
// Standard Pyrethroid Routine - Category 41, Intervention 88
const DEFAULT_INTERVENTIONS = new Map<number, number>([
  [37, 78], // CM
  [40, 85], // Standard Pyrethroid Campaign
  [41, 88], // Standard Pyrethroid Routine
]);

// Default coverage percentage for interventions (PRD intervention-coverage)
const DEFAULT_COVERAGE = 70;

// Coverage percentage options (0-100 in increments of 10)
const COVERAGE_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

interface RuleEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  rule: SavedRule | null;
  rulesCount: number;
  metricTypes: MetricType[];
  groupedMetricTypes: Record<string, MetricType[]>;
  interventionCategories: InterventionCategory[];
  onSave: (rule: SavedRule) => void;
  /** Function to look up district name by ID */
  getDistrictName: (districtId: string) => string;
  /** Districts GeoJSON data for computing matching districts */
  districts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null;
  /** Pre-loaded metric values by type: metricTypeId -> orgUnitId -> value */
  metricValuesByType?: Record<number, Record<number, number>>;
}

export function RuleEditModal({
  isOpen,
  onOpenChange,
  rule,
  rulesCount,
  metricTypes: _metricTypes,
  groupedMetricTypes,
  interventionCategories,
  onSave,
  getDistrictName,
  districts,
  metricValuesByType,
}: RuleEditModalProps) {
  void _metricTypes;

  const [title, setTitle] = useState("");
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [criteria, setCriteria] = useState<RuleCriterion[]>([createEmptyCriterion()]);
  const [interventionsByCategory, setInterventionsByCategory] = useState<Map<number, number>>(new Map());
  const [coverageByCategory, setCoverageByCategory] = useState<Map<number, number>>(new Map());
  const [excludedDistrictIds, setExcludedDistrictIds] = useState<string[]>([]);

  // Convert criteria state to Rule format for the hook
  const rulesForHook = useMemo(() => {
    return criteria.map((c) => ({
      id: c.id,
      metricTypeId: c.metricTypeId,
      operator: c.operator,
      value: c.value,
    }));
  }, [criteria]);

  // Get matching districts based on current criteria
  const { matchingDistricts } = useDistrictRules({
    districts,
    rules: rulesForHook,
    selectedProvinceId: null, // Don't filter by province in rule editor
    externalMetricValues: metricValuesByType,
  });

  // Convert matching districts to format expected by AddExceptionPopover
  const matchingDistrictOptions = useMemo(() => {
    return matchingDistricts.map((d) => ({
      id: d.districtId,
      name: d.districtName,
    }));
  }, [matchingDistricts]);

  const handleAddException = useCallback((districtId: string) => {
    setExcludedDistrictIds((prev) => [...prev, districtId]);
  }, []);

  // Reset form when modal opens or rule changes
  useEffect(() => {
    if (isOpen) {
      if (rule) {
        setTitle(rule.title);
        setColor(rule.color);
        setCriteria(rule.criteria.length > 0 ? [...rule.criteria] : [createEmptyCriterion()]);
        setInterventionsByCategory(new Map(rule.interventionsByCategory));
        // Initialize coverage: use saved values or default to 70% for each intervention
        const initialCoverage = new Map<number, number>();
        Array.from(rule.interventionsByCategory.keys()).forEach((categoryId) => {
          const savedCoverage = rule.coverageByCategory?.get(categoryId);
          initialCoverage.set(categoryId, savedCoverage ?? DEFAULT_COVERAGE);
        });
        setCoverageByCategory(initialCoverage);
        setExcludedDistrictIds(rule.excludedDistrictIds ?? []);
      } else {
        const defaultTitle = `Category ${rulesCount + 1}`;
        const defaultColor = DEFAULT_COLORS[rulesCount % DEFAULT_COLORS.length];
        setTitle(defaultTitle);
        setColor(defaultColor);
        setCriteria([]);
        setInterventionsByCategory(new Map());
        setCoverageByCategory(new Map());
        setExcludedDistrictIds([]);
      }
    }
  }, [isOpen, rule, rulesCount]);

  const handleUpdateCriterion = useCallback((id: string, updates: Partial<RuleCriterion>) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const handleDeleteCriterion = useCallback((id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleAddCriterion = useCallback((metricTypeId: number) => {
    setCriteria((prev) => [...prev, { ...createEmptyCriterion(), metricTypeId }]);
  }, []);

  const handleSelectIntervention = useCallback((categoryId: number, interventionId: number | null) => {
    setInterventionsByCategory((prev) => {
      const next = new Map(prev);
      if (interventionId === null) {
        next.delete(categoryId);
      } else {
        next.set(categoryId, interventionId);
      }
      return next;
    });
    // Also manage coverageByCategory: add default coverage when selecting, remove when deselecting
    setCoverageByCategory((prev) => {
      const next = new Map(prev);
      if (interventionId === null) {
        next.delete(categoryId);
      } else if (!next.has(categoryId)) {
        // Only set default if not already present (preserves existing value when switching interventions within same category)
        next.set(categoryId, DEFAULT_COVERAGE);
      }
      return next;
    });
  }, []);

  const handleRemoveException = useCallback((districtId: string) => {
    setExcludedDistrictIds((prev) => prev.filter((id) => id !== districtId));
  }, []);

  const handleCoverageChange = useCallback((categoryId: number, coverage: number) => {
    setCoverageByCategory((prev) => {
      const next = new Map(prev);
      next.set(categoryId, coverage);
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    const validCriteria = criteria.filter(
      (c) => c.metricTypeId !== null && c.value !== ""
    );

    const defaultTitle = `Category ${rulesCount + 1}`;
    const savedRule: SavedRule = {
      id: rule?.id ?? generateId(),
      title: title.trim() || defaultTitle,
      color,
      criteria: validCriteria,
      interventionsByCategory: new Map(interventionsByCategory),
      coverageByCategory: new Map(coverageByCategory),
      excludedDistrictIds: excludedDistrictIds.length > 0 ? excludedDistrictIds : undefined,
    };

    onSave(savedRule);
    onOpenChange(false);
  }, [rule, title, color, criteria, interventionsByCategory, coverageByCategory, excludedDistrictIds, rulesCount, onSave, onOpenChange]);

  const isEditing = rule !== null;
  const hasValidCriteria = criteria.some((c) => c.metricTypeId !== null && c.value !== "");
  const hasInterventions = interventionsByCategory.size > 0;
  const canSave = hasValidCriteria && hasInterventions;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rule" : "Create Rule"}</DialogTitle>

        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-8 py-4">
          {/* Title input with color picker */}
          <div>
            <label htmlFor="rule-title" className="text-sm font-medium mb-2 block">
              Rule Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer p-1"
              />
              <Input
                id="rule-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter rule name..."
                className="flex-1"
              />
            </div>
          </div>

          {/* Criteria section */}
          <CollapsibleSection step={1} title="Selection Criteria">
            <div className="space-y-3">
              {criteria.map((criterion) => (
                <CriterionRow
                  key={criterion.id}
                  criterion={criterion}
                  metricTypes={_metricTypes}
                  onUpdate={handleUpdateCriterion}
                  onDelete={handleDeleteCriterion}
                />
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2">
                  Add Criterion
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {Object.entries(groupedMetricTypes).map(([category, metrics]) => (
                  <React.Fragment key={category}>
                    <DropdownMenuLabel>{category}</DropdownMenuLabel>
                    {metrics.map((metric) => (
                      <DropdownMenuItem
                        key={metric.id}
                        onClick={() => handleAddCriterion(metric.id)}
                      >
                        {metric.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CollapsibleSection>

          {/* Interventions section */}
          <CollapsibleSection step={2} title="Interventions">
            <div className="space-y-2">
              {Array.from(interventionsByCategory.entries()).map(([categoryId, interventionId]) => {
                const category = interventionCategories.find((c) => c.id === categoryId);
                const categoryName = category?.name ?? "Unknown";
                const categoryInterventions = category?.interventions ?? [];

                return (
                  <div key={categoryId} className="flex items-center gap-2 group">
                    <span className="text-sm font-medium text-muted-foreground w-[240px] shrink-0 truncate" title={categoryName}>
                      {categoryName}
                    </span>

                    <Select
                      value={interventionId.toString()}
                      onValueChange={(value) => {
                        handleSelectIntervention(categoryId, parseInt(value, 10));
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select intervention..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryInterventions.map((intv) => (
                          <SelectItem key={intv.id} value={intv.id.toString()}>
                            {intv.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={(coverageByCategory.get(categoryId) ?? DEFAULT_COVERAGE).toString()}
                      onValueChange={(value) => handleCoverageChange(categoryId, parseInt(value, 10))}
                    >
                      <SelectTrigger className="w-[80px]" aria-label="Coverage percentage">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COVERAGE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option.toString()}>
                            {option}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSelectIntervention(categoryId, null)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  disabled={interventionsByCategory.size >= interventionCategories.length}
                >
    
                  Add Intervention
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {interventionCategories
                  .filter((cat) => !interventionsByCategory.has(cat.id) && cat.interventions.length > 0)
                  .map((cat) => (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => handleSelectIntervention(cat.id, cat.interventions[0].id)}
                    >
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CollapsibleSection>

          {/* Exceptions section */}
          <CollapsibleSection step={3} title="Exceptions">
            <ExceptionList
              excludedDistrictIds={excludedDistrictIds}
              getDistrictName={getDistrictName}
              onRemove={handleRemoveException}
            />
            <AddExceptionPopover
              matchingDistricts={matchingDistrictOptions}
              excludedDistrictIds={excludedDistrictIds}
              onAddException={handleAddException}
              trigger={
                <Button variant="ghost" size="sm" className="mt-2">
    
                  Add Exception
                </Button>
              }
            />
          </CollapsibleSection>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isEditing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
