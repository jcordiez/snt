"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { X, Trash2, Plus, MapPin, Users } from "lucide-react";
import { ExceptionList } from "./exception-list";
import { AddExceptionPopover } from "./add-exception-popover";
import { AddInclusionPopover } from "./add-inclusion-popover";
import { InclusionList } from "./inclusion-list";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { useDistrictRules } from "@/hooks/use-district-rules";
import type { DistrictProperties } from "@/data/districts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
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
import type { SavedRule, RuleCriterion, InclusionEntry } from "@/types/rule";

function formatNumber(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/**
 * Calculate the step size for a slider based on the max value.
 */
function getSliderStep(max: number | null): number {
  if (max === null) return 1;
  if (max < 1) return 0.05;
  if (max < 1000) return 5;
  if (max < 10000) return 100;
  return 5000;
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

// Default coverage percentage for interventions
const DEFAULT_COVERAGE = 70;

// Population metric ID
const POPULATION_METRIC_ID = 325;

// Coverage percentage options (0-100 in increments of 10)
const COVERAGE_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

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

  const step = getSliderStep(max);
  const sliderMin = min ?? 0;
  const sliderMax = max ?? 100;
  const currentValue = criterion.value ? Number(criterion.value) : sliderMin;

  const handleSliderChange = (values: number[]) => {
    onUpdate(criterion.id, { value: String(values[0]) });
  };

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-xs font-medium text-muted-foreground w-[160px] pr-4 line-clamp-2 shrink-0" title={metricName}>
        {metricName}
      </span>

      <Select
        value={criterion.operator}
        onValueChange={(value) => onUpdate(criterion.id, { operator: value as RuleOperator })}
      >
        <SelectTrigger className="w-[60px] shrink-0">
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

      <span className="text-sm font-semibold w-[30px] text-right  tabular-nums shrink-0">
        {isLoading ? "..." : formatNumber(currentValue)}
      </span>

      {!isLoading && min !== null && max !== null ? (
        <Slider
          value={[currentValue]}
          onValueChange={handleSliderChange}
          min={sliderMin}
          max={sliderMax}
          step={step}
          className="flex-1"
        />
      ) : (
        <div className="flex-1" />
      )}

      

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(criterion.id)}
        className="opacity-0 group-hover:opacity-100  transition-opacity shrink-0 h-8 w-8"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface RuleEditorPanelProps {
  rule: SavedRule;
  metricTypes: MetricType[];
  groupedMetricTypes: Record<string, MetricType[]>;
  interventionCategories: InterventionCategory[];
  onSave: (rule: SavedRule) => void;
  onClose: () => void;
  getDistrictName: (districtId: string) => string;
  districts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null;
  metricValuesByType?: Record<number, Record<number, number>>;
  /** When true, auto-focus the title input and select all text */
  autoFocusTitle?: boolean;
}

export function RuleEditorPanel({
  rule,
  metricTypes,
  groupedMetricTypes,
  interventionCategories,
  onSave,
  onClose,
  getDistrictName,
  districts,
  metricValuesByType,
  autoFocusTitle,
}: RuleEditorPanelProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(rule.title);
  const [color, setColor] = useState(rule.color);
  const [criteria, setCriteria] = useState<RuleCriterion[]>(
    rule.criteria.length > 0 ? [...rule.criteria] : []
  );
  const [interventionsByCategory, setInterventionsByCategory] = useState<Map<number, number>>(
    new Map(rule.interventionsByCategory)
  );
  const [coverageByCategory, setCoverageByCategory] = useState<Map<number, number>>(() => {
    const initialCoverage = new Map<number, number>();
    Array.from(rule.interventionsByCategory.keys()).forEach((categoryId) => {
      const savedCoverage = rule.coverageByCategory?.get(categoryId);
      initialCoverage.set(categoryId, savedCoverage ?? DEFAULT_COVERAGE);
    });
    return initialCoverage;
  });
  const [excludedDistrictIds, setExcludedDistrictIds] = useState<string[]>(
    rule.excludedDistrictIds ?? []
  );
  const [inclusionEntries, setInclusionEntries] = useState<InclusionEntry[]>(
    rule.inclusionEntries ?? []
  );

  // Compute includedDistrictIds from inclusionEntries for rule matching
  const includedDistrictIds = useMemo(() => {
    const ids: string[] = [];
    for (const entry of inclusionEntries) {
      ids.push(...entry.districtIds);
    }
    return ids;
  }, [inclusionEntries]);

  // Track the rule ID to detect when selection changes
  const prevRuleIdRef = useRef(rule.id);

  // Reset form when a different rule is selected
  useEffect(() => {
    if (rule.id !== prevRuleIdRef.current) {
      prevRuleIdRef.current = rule.id;
      setTitle(rule.title);
      setColor(rule.color);
      setCriteria(rule.criteria.length > 0 ? [...rule.criteria] : []);
      setInterventionsByCategory(new Map(rule.interventionsByCategory));
      const initialCoverage = new Map<number, number>();
      Array.from(rule.interventionsByCategory.keys()).forEach((categoryId) => {
        const savedCoverage = rule.coverageByCategory?.get(categoryId);
        initialCoverage.set(categoryId, savedCoverage ?? DEFAULT_COVERAGE);
      });
      setCoverageByCategory(initialCoverage);
      setExcludedDistrictIds(rule.excludedDistrictIds ?? []);
      setInclusionEntries(rule.inclusionEntries ?? []);
    }
  }, [rule]);

  // Auto-focus and select title input when autoFocusTitle is true
  useEffect(() => {
    if (autoFocusTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [autoFocusTitle, rule.id]);

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
    selectedProvinceId: null,
    externalMetricValues: metricValuesByType,
  });

  // Convert matching districts to format expected by AddExceptionPopover
  const matchingDistrictOptions = useMemo(() => {
    return matchingDistricts.map((d) => ({
      id: d.districtId,
      name: d.districtName,
    }));
  }, [matchingDistricts]);

  // Compute final matching district stats (after exclusions and inclusions)
  const matchingStats = useMemo(() => {
    // Start with matching district IDs from criteria
    const matchingIds = new Set(matchingDistricts.map((d) => d.districtId));

    // Remove excluded districts
    excludedDistrictIds.forEach((id) => matchingIds.delete(id));

    // Add included districts
    includedDistrictIds.forEach((id) => matchingIds.add(id));

    // Calculate total population
    const populationByOrgUnit = metricValuesByType?.[POPULATION_METRIC_ID] ?? {};
    let totalPopulation = 0;
    matchingIds.forEach((districtId) => {
      const pop = populationByOrgUnit[Number(districtId)];
      if (pop) totalPopulation += pop;
    });

    return {
      districtCount: matchingIds.size,
      totalPopulation,
    };
  }, [matchingDistricts, excludedDistrictIds, includedDistrictIds, metricValuesByType]);

  // Auto-save when form changes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const validCriteria = criteria.filter(
        (c) => c.metricTypeId !== null && c.value !== ""
      );

      const savedRule: SavedRule = {
        ...rule,
        title: title.trim() || rule.title,
        color,
        criteria: validCriteria,
        interventionsByCategory: new Map(interventionsByCategory),
        coverageByCategory: new Map(coverageByCategory),
        excludedDistrictIds: excludedDistrictIds.length > 0 ? excludedDistrictIds : undefined,
        inclusionEntries: inclusionEntries.length > 0 ? inclusionEntries : undefined,
        includedDistrictIds: includedDistrictIds.length > 0 ? includedDistrictIds : undefined,
      };

      onSave(savedRule);
    }, 300);
  }, [rule, title, color, criteria, interventionsByCategory, coverageByCategory, excludedDistrictIds, inclusionEntries, includedDistrictIds, onSave]);

  // Trigger save on changes
  useEffect(() => {
    triggerSave();
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, color, criteria, interventionsByCategory, coverageByCategory, excludedDistrictIds, inclusionEntries, triggerSave]);

  const handleAddException = useCallback((districtId: string) => {
    setExcludedDistrictIds((prev) => [...prev, districtId]);
  }, []);

  const handleUpdateCriterion = useCallback((id: string, updates: Partial<RuleCriterion>) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const handleDeleteCriterion = useCallback((id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleAddCriterion = useCallback((metricTypeId: number) => {
    const newCriterion = { ...createEmptyCriterion(), metricTypeId };
    setCriteria((prev) => [...prev, newCriterion]);
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
    setCoverageByCategory((prev) => {
      const next = new Map(prev);
      if (interventionId === null) {
        next.delete(categoryId);
      } else if (!next.has(categoryId)) {
        next.set(categoryId, DEFAULT_COVERAGE);
      }
      return next;
    });
  }, []);

  const handleRemoveException = useCallback((districtId: string) => {
    setExcludedDistrictIds((prev) => prev.filter((id) => id !== districtId));
  }, []);

  const handleAddInclusion = useCallback((entry: InclusionEntry) => {
    setInclusionEntries((prev) => [...prev, entry]);
  }, []);

  const handleRemoveInclusion = useCallback((entryId: string, level: InclusionEntry["level"]) => {
    setInclusionEntries((prev) =>
      prev.filter((e) => !(e.id === entryId && e.level === level))
    );
  }, []);

  const handleCoverageChange = useCallback((categoryId: number, coverage: number) => {
    setCoverageByCategory((prev) => {
      const next = new Map(prev);
      next.set(categoryId, coverage);
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-slate-50 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#E3E8EF] shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 rounded border cursor-pointer p-0.5"
          />
          <Input
            ref={titleInputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="md:text-lg font-medium border-none shadow-none p-0 h-auto focus-visible:ring-0"
            placeholder="Rule name..."
          />
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <div className="space-y-8">

           {/* Criteria section */}
           <CollapsibleSection
            step={2}
            title="Selection Criteria"
            action={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
            }
          >
            <div className="space-y-1">
              {criteria.map((criterion) => (
                <CriterionRow
                  key={criterion.id}
                  criterion={criterion}
                  metricTypes={metricTypes}
                  onUpdate={handleUpdateCriterion}
                  onDelete={handleDeleteCriterion}
                />
              ))}
            </div>
          </CollapsibleSection>

          {/* Interventions section */}
          <CollapsibleSection
            step={1}
            title="Interventions"
            action={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={interventionsByCategory.size >= interventionCategories.length}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
            }
          >
            <div className="space-y-2">
              {Array.from(interventionsByCategory.entries()).map(([categoryId, interventionId]) => {
                const category = interventionCategories.find((c) => c.id === categoryId);
                const categoryName = category?.name ?? "Unknown";
                const categoryInterventions = category?.interventions ?? [];

                return (
                  <div key={categoryId} className="flex items-center gap-2 group">
                    <span className="text-xs w-[160px] pr-4 line-clamp-2 font-medium text-muted-foreground truncate" title={categoryName}>
                      {categoryName}
                    </span>

                    <Select
                      value={interventionId.toString()}
                      onValueChange={(value) => {
                        handleSelectIntervention(categoryId, parseInt(value, 10));
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryInterventions.map((intv) => (
                          <SelectItem key={intv.id} value={intv.id.toString()}>
                            {intv.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

{/*}
                    <Select
                      value={(coverageByCategory.get(categoryId) ?? DEFAULT_COVERAGE).toString()}
                      onValueChange={(value) => handleCoverageChange(categoryId, parseInt(value, 10))}
                    >
                      <SelectTrigger className="w-[70px]" aria-label="Coverage percentage">
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
*/}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSelectIntervention(categoryId, null)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

         
          {/* Exclude section */}
          <CollapsibleSection
            step={3}
            title="Exclude"
            action={
              <AddExceptionPopover
                matchingDistricts={matchingDistrictOptions}
                excludedDistrictIds={excludedDistrictIds}
                onAddException={handleAddException}
                trigger={
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
            }
          >
            <ExceptionList
              excludedDistrictIds={excludedDistrictIds}
              getDistrictName={getDistrictName}
              onRemove={handleRemoveException}
            />
          </CollapsibleSection>

          {/* Include section */}
          <CollapsibleSection
            step={4}
            title="Include"
            action={
              <AddInclusionPopover
                districts={districts}
                inclusionEntries={inclusionEntries}
                onAddInclusion={handleAddInclusion}
              />
            }
          >
            <InclusionList
              entries={inclusionEntries}
              onRemove={handleRemoveInclusion}
            />
          </CollapsibleSection>


        </div>
      </div>

      {/* Fixed footer with matching districts stats */}
      <div className="shrink-0 p-4">
        <div className="flex gap-3">
          <div className="flex-1 p-3 bg-white rounded-lg">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs">Districts</span>
            </div>
            <div className="text-xl font-semibold text-slate-700">
              {matchingStats.districtCount.toLocaleString()}
            </div>
          </div>
          <div className="flex-1 p-3 bg-white rounded-lg">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">Population</span>
            </div>
            <div className="text-xl font-semibold text-slate-700">
              {matchingStats.totalPopulation.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
