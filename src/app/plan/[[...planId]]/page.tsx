"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  InterventionMap,
  CountryName,
  GeographicFilter,
  NavigationTabs,
  ListView,
  BudgetView,
  type ViewTab,
} from "@/components/intervention-map";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AddInterventionSheet } from "@/components/intervention-map/add-intervention";
import { RulesSidebar, RuleEditModal } from "@/components/intervention-map/rules-sidebar";
import { Province } from "@/data/districts";
import { useOrgUnits, createInterventionMix } from "@/hooks/use-orgunits";
import { useInterventionCategories } from "@/hooks/use-intervention-categories";
import { useMetricTypes } from "@/hooks/use-metric-types";
import { useMetricValues } from "@/hooks/use-metric-values";
import { useMultipleMetricValues } from "@/hooks/use-multiple-metric-values";
import { findMatchingDistrictIds, findRulesMatchingDistrict, findRulesWithDistrictAsException, getDistrictInterventions, getLastMatchingRuleColor, getBlendedMatchingRuleColor } from "@/hooks/use-district-rules";
import { LegendSelectionPayload } from "@/types/intervention";
import type { SavedRule } from "@/types/rule";
import type { Rule } from "@/types/intervention";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { getPlanById, getDefaultRulesForNewPlan } from "@/data/predefined-plans";
import { ComparisonSidebar, useComparisonSidebar } from "@/components/comparison-sidebar";
import { generateRulesFromGuidelines } from "@/utils/generate-rules-from-guidelines";
import { GUIDELINE_VARIATIONS } from "@/data/intervention-guidelines-variations";

// All metric IDs that have data files available - defined outside component
// to maintain stable reference and prevent infinite re-fetch loops
const ALL_METRIC_IDS_WITH_DATA = [404, 406, 407, 410, 411, 412, 413, 417, 418, 419, 420];

/**
 * Serializes a SavedRule to a comparable string representation.
 * Handles Map objects that aren't serialized by JSON.stringify.
 */
function serializeRule(rule: SavedRule): string {
  return JSON.stringify({
    id: rule.id,
    title: rule.title,
    color: rule.color,
    criteria: rule.criteria,
    interventionsByCategory: Array.from(rule.interventionsByCategory.entries()).sort((a, b) => a[0] - b[0]),
    coverageByCategory: rule.coverageByCategory
      ? Array.from(rule.coverageByCategory.entries()).sort((a, b) => a[0] - b[0])
      : [],
    isAllDistricts: rule.isAllDistricts ?? false,
    excludedDistrictIds: [...(rule.excludedDistrictIds ?? [])].sort(),
    isVisible: rule.isVisible ?? true,
  });
}

/**
 * Compares two arrays of SavedRules for equality.
 * Returns true if the rules are identical in content and order.
 */
function areRulesEqual(rulesA: SavedRule[], rulesB: SavedRule[]): boolean {
  if (rulesA.length !== rulesB.length) return false;
  for (let i = 0; i < rulesA.length; i++) {
    if (serializeRule(rulesA[i]) !== serializeRule(rulesB[i])) {
      return false;
    }
  }
  return true;
}

export default function PlanPage() {
  const params = useParams();
  // [[...planId]] is an optional catch-all, so params.planId is string[] | undefined
  const planIdSegments = params.planId as string[] | undefined;
  const planId = planIdSegments?.[0] ?? null;
  const isNewPlan = !planId;

  const { data: districts, provinces, isLoading, updateDistricts } = useOrgUnits();
  const { data: interventionCategories } = useInterventionCategories();
  const { data: metricTypes } = useMetricTypes();
  // Load metric values for tooltip display
  const { valuesByOrgUnit: mortalityByOrgUnit } = useMetricValues(407);      // Mortalité infanto-juvénile
  const { valuesByOrgUnit: incidenceByOrgUnit } = useMetricValues(410);      // Incidence
  const { valuesByOrgUnit: resistanceByOrgUnit } = useMetricValues(412);     // Résistance aux insecticides
  const { valuesByOrgUnit: seasonalityByOrgUnit } = useMetricValues(413);    // Saisonnalité
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("map");
  const [savedRules, setSavedRules] = useState<SavedRule[]>([]);
  const [originalRules, setOriginalRules] = useState<SavedRule[]>([]);
  const [isCumulativeMode, setIsCumulativeMode] = useState(true);

  // Pre-load all metric values that have data files (eliminates race condition)
  const { metricValuesByType } = useMultipleMetricValues(ALL_METRIC_IDS_WITH_DATA);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [highlightedDistrictIds, setHighlightedDistrictIds] = useState<string[]>([]);
  const [legendSelectionPayload, setLegendSelectionPayload] = useState<LegendSelectionPayload | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const { isOpen: isComparisonOpen, toggle: toggleComparison } = useComparisonSidebar();
  const rulesInitialized = useRef(false);

  // Get the plan definition (null for new plans)
  const plan = planId ? getPlanById(planId) : null;
  const displayName = isNewPlan ? "New Plan" : (plan?.name ?? "Unknown Plan");

  // Initialize rules on load
  useEffect(() => {
    if (
      rulesInitialized.current ||
      !districts?.features.length ||
      !interventionCategories?.length
    ) {
      return;
    }

    // For existing plans, also require the plan to exist
    if (!isNewPlan && !plan) {
      return;
    }

    rulesInitialized.current = true;

    if (isNewPlan) {
      // Load default rules for new plan
      const defaultRules = getDefaultRulesForNewPlan();
      setSavedRules(defaultRules);
      setOriginalRules(defaultRules);
      console.log("Initialized new plan with default rules");
    } else {
      // Load rules from predefined plan
      // Store both the working copy and the original for edit detection
      setSavedRules(plan!.rules);
      setOriginalRules(plan!.rules);
      console.log("Initialized plan:", plan!.name, "with", plan!.rules.length, "rules");
    }
  }, [districts, interventionCategories, plan, isNewPlan]);

  // Compute whether the current plan has been edited from its original state
  const isEdited = useMemo(() => {
    // If no original rules yet, not edited
    if (originalRules.length === 0) return false;
    return !areRulesEqual(savedRules, originalRules);
  }, [savedRules, originalRules]);

  // Track whether rules have been applied for the current configuration
  const rulesAppliedKeyRef = useRef<string>("");

  // Check if all data is ready for rule application
  const metricValuesLoaded = Object.keys(metricValuesByType).length > 0;
  const isReadyToApplyRules =
    districts?.features.length &&
    interventionCategories?.length &&
    savedRules.length > 0 &&
    metricValuesLoaded;

  // Compute the rules key outside the effect to ensure consistent tracking
  const currentRulesKey = isReadyToApplyRules
    ? JSON.stringify({
        rules: savedRules.map((r) => ({
          id: r.id,
          criteria: r.criteria,
          interventionsByCategory: Array.from(r.interventionsByCategory.entries()),
          coverageByCategory: r.coverageByCategory ? Array.from(r.coverageByCategory.entries()) : [],
          isAllDistricts: r.isAllDistricts,
          color: r.color,
          excludedDistrictIds: r.excludedDistrictIds,
          isVisible: r.isVisible,
        })),
        selectedProvinceId: selectedProvince?.id ?? null,
        isCumulativeMode,
      })
    : null;

  // Apply rules when all data is ready and rules have changed
  useEffect(() => {
    // Skip if not ready or nothing has changed
    if (!isReadyToApplyRules || !currentRulesKey || currentRulesKey === rulesAppliedKeyRef.current) {
      return;
    }

    // Mark rules as applied for this configuration
    rulesAppliedKeyRef.current = currentRulesKey;

    console.log("Applying rules:", savedRules.length, "rules, cumulative:", isCumulativeMode);

    // Filter out hidden rules (isVisible === false)
    const visibleRules = savedRules.filter((r) => r.isVisible !== false);

    // Reset all districts to clean state before re-applying rules
    const filteredDistrictIds = districts!.features
      .filter((f) => selectedProvince ? f.properties.regionId === selectedProvince.id : true)
      .map((f) => f.properties.districtId);

    const emptyMix = { categoryAssignments: new Map(), displayLabel: "None" };
    updateDistricts(filteredDistrictIds, emptyMix, interventionCategories!, { replace: true, ruleColor: "" });

    // Build all updates first, then apply them in a single batch to avoid race conditions
    const updates: Array<{
      districtIds: string[];
      interventionMix: ReturnType<typeof createInterventionMix>;
      ruleColor: string;
    }> = [];

    if (isCumulativeMode) {
      // Cumulative mode: compute merged interventions per district using getDistrictInterventions
      // Transpose metricValuesByType to districtId -> metricTypeId -> value
      const metricValuesByDistrict: Record<string, Record<number, number>> = {};
      for (const [metricTypeId, valuesByOrgUnit] of Object.entries(metricValuesByType)) {
        const typeId = Number(metricTypeId);
        for (const [orgUnitId, value] of Object.entries(valuesByOrgUnit)) {
          const districtId = String(orgUnitId);
          if (!metricValuesByDistrict[districtId]) {
            metricValuesByDistrict[districtId] = {};
          }
          metricValuesByDistrict[districtId][typeId] = value;
        }
      }

      const filteredFeatures = selectedProvince
        ? districts!.features.filter((f) => f.properties.regionId === selectedProvince.id)
        : districts!.features;

      for (const feature of filteredFeatures) {
        const districtId = feature.properties.districtId;
        const result = getDistrictInterventions(districtId, visibleRules, metricValuesByDistrict, true);
        if (result && result.interventionsByCategory.size > 0) {
          const interventionMix = createInterventionMix(
            result.interventionsByCategory,
            interventionCategories!
          );
          // Blend colors from all matching rules for this district
          const ruleColor = getBlendedMatchingRuleColor(districtId, visibleRules, metricValuesByDistrict);
          updates.push({
            districtIds: [districtId],
            interventionMix,
            ruleColor: ruleColor ?? "",
          });
        }
      }
    } else {
      // Exclusive mode: apply rules sequentially, last matching rule wins

      // Find the default rule (isAllDistricts=true, usually first) to reset all districts first
      const defaultRule = visibleRules.find((r) => r.isAllDistricts);
      const nonDefaultRules = visibleRules.filter((r) => !r.isAllDistricts);

      // First, prepare default rule update for all districts
      if (defaultRule && defaultRule.interventionsByCategory.size > 0) {
        const allDistrictIds = districts!.features
          .filter((f) =>
            selectedProvince
              ? f.properties.regionId === selectedProvince.id
              : true
          )
          .map((f) => f.properties.districtId);

        const defaultMix = createInterventionMix(
          defaultRule.interventionsByCategory,
          interventionCategories!
        );

        updates.push({
          districtIds: allDistrictIds,
          interventionMix: defaultMix,
          ruleColor: defaultRule.color,
        });
      }

      // Then prepare non-default rules in order (later rules override earlier for overlapping districts)
      for (const rule of nonDefaultRules) {
        const rulesForEvaluation: Rule[] = rule.criteria.map((criterion) => ({
          id: criterion.id,
          metricTypeId: criterion.metricTypeId,
          operator: criterion.operator,
          value: criterion.value,
        }));

        const matchingDistrictIds = findMatchingDistrictIds(
          districts!,
          rulesForEvaluation,
          selectedProvince?.id ?? null,
          metricValuesByType
        );

        // Filter out excluded districts (exceptions)
        const finalDistrictIds = rule.excludedDistrictIds?.length
          ? matchingDistrictIds.filter((id) => !rule.excludedDistrictIds!.includes(id))
          : matchingDistrictIds;

        if (finalDistrictIds.length > 0 && rule.interventionsByCategory.size > 0) {
          const interventionMix = createInterventionMix(
            rule.interventionsByCategory,
            interventionCategories!
          );

          updates.push({
            districtIds: finalDistrictIds,
            interventionMix,
            ruleColor: rule.color,
          });
        }
      }
    }

    // Apply all updates in sequence - React will batch these state updates
    for (const update of updates) {
      updateDistricts(
        update.districtIds,
        update.interventionMix,
        interventionCategories!,
        { replace: isCumulativeMode, ruleColor: update.ruleColor }
      );
    }

    console.log("Applied", updates.length, "rule updates");
  }, [isReadyToApplyRules, currentRulesKey, savedRules, selectedProvince, districts, interventionCategories, updateDistricts, metricValuesByType, isCumulativeMode]);

  const handleHighlightDistricts = useCallback((districtIds: string[]) => {
    setHighlightedDistrictIds(districtIds);
  }, []);

  const handleSelectMix = useCallback((mixLabel: string, districtIds: string[]) => {
    // Find a sample district to extract interventionsByCategory
    const sampleDistrict = districts?.features.find(
      f => f.properties.interventionMixLabel === mixLabel
    );

    const interventionsByCategory = sampleDistrict?.properties.interventionCategoryAssignments
      ? new Map(Object.entries(sampleDistrict.properties.interventionCategoryAssignments)
          .map(([k, v]) => [Number(k), v as number]))
      : new Map();

    setLegendSelectionPayload({ districtIds, interventionsByCategory, mixLabel });
    setIsSheetOpen(true);
  }, [districts]);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setIsSheetOpen(open);
    if (!open) setLegendSelectionPayload(null);
  }, []);

  const handleApplyInterventions = useCallback((
    districtIds: string[],
    selectedInterventionsByCategory: Map<number, number>,
    options?: { replace?: boolean }
  ) => {
    // Create the intervention mix from category selections
    const interventionMix = createInterventionMix(
      selectedInterventionsByCategory,
      interventionCategories
    );

    // Update districts with the new intervention mix
    // When replace is true (editing from legend), fully replaces the mix
    // Otherwise uses additive merge with existing interventions
    updateDistricts(districtIds, interventionMix, interventionCategories, options);

    console.log("Applied interventions:", {
      districtIds,
      replace: options?.replace,
      interventionMix: {
        displayLabel: interventionMix.displayLabel,
        categoryAssignments: Object.fromEntries(interventionMix.categoryAssignments),
      },
    });
  }, [interventionCategories, updateDistricts]);

  const handleAddRule = useCallback(() => {
    setEditingRuleId(null);
    setIsRuleModalOpen(true);
  }, []);

  const handleGenerateFromGuidelines = useCallback((variationId: string) => {
    const generatedRules = generateRulesFromGuidelines(variationId);
    const variation = GUIDELINE_VARIATIONS.find(v => v.id === variationId);
    const variationName = variation?.name ?? "Guidelines";
    setSavedRules(generatedRules);
    toast.success(`Generated rules from ${variationName}`);
    console.log("Generated", generatedRules.length, "rules from", variationName);
  }, []);

  const handleEditRule = useCallback((ruleId: string) => {
    setEditingRuleId(ruleId);
    setIsRuleModalOpen(true);
  }, []);

  const handleDeleteRule = useCallback((ruleId: string) => {
    setSavedRules((prev) => prev.filter((r) => r.id !== ruleId));
  }, []);

  const handleToggleRuleVisibility = useCallback((ruleId: string) => {
    setSavedRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId
          ? { ...rule, isVisible: rule.isVisible === false ? true : false }
          : rule
      )
    );
  }, []);

  const handleReorderRules = useCallback((newOrder: SavedRule[]) => {
    setSavedRules(newOrder);
  }, []);

  const handleSaveRule = useCallback((rule: SavedRule) => {
    // Update the saved rules state - the useEffect will handle applying rules to the map
    setSavedRules((prev) => {
      const existingIndex = prev.findIndex((r) => r.id === rule.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = rule;
        return updated;
      }
      return [...prev, rule];
    });
    console.log("handleSaveRule: saved rule", rule.id, rule.title);
  }, []);

  const handleRuleModalOpenChange = useCallback((open: boolean) => {
    setIsRuleModalOpen(open);
    if (!open) {
      setEditingRuleId(null);
    }
  }, []);

  const getDistrictName = useCallback((districtId: string): string => {
    if (!districts) return districtId;
    const feature = districts.features.find((f) => f.properties.districtId === districtId);
    return feature?.properties.districtName ?? districtId;
  }, [districts]);

  const editingRule = editingRuleId
    ? savedRules.find((r) => r.id === editingRuleId) ?? null
    : null;

  const handleExportPlan = useCallback(() => {
    if (!districts?.features.length || !interventionCategories?.length) {
      return;
    }

    // Build a flat list of all interventions with their column headers
    // Format: "{name} - {code}"
    const interventionColumns: Array<{
      categoryId: number;
      interventionId: number;
      header: string;
    }> = [];

    for (const category of interventionCategories) {
      for (const intervention of category.interventions) {
        interventionColumns.push({
          categoryId: category.id,
          interventionId: intervention.id,
          header: `${intervention.name} - ${intervention.code}`,
        });
      }
    }

    // Build CSV header
    const headers = ["org_unit_id", "org_unit_name", ...interventionColumns.map((col) => col.header)];

    // Build CSV rows
    const rows = districts.features.map((feature) => {
      const props = feature.properties;
      const assignments = props.interventionCategoryAssignments || {};

      // For each intervention column, output 1 if assigned, 0 otherwise
      const interventionValues = interventionColumns.map((col) => {
        const assignedInterventionId = assignments[String(col.categoryId)];
        return assignedInterventionId === col.interventionId ? "1" : "0";
      });

      return [props.districtId, props.districtName, ...interventionValues];
    });

    // Escape CSV values (handle commas and quotes)
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV content
    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    const exportPlanId = isNewPlan ? "new" : planId;
    link.setAttribute("href", url);
    link.setAttribute("download", `intervention-plan-${exportPlanId}-${date}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [districts, interventionCategories, planId, isNewPlan]);

  // Show error if plan not found (only for existing plans)
  if (!isNewPlan && !plan) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Plan Not Found</h1>
        <p className="text-muted-foreground">
          The plan &quot;{planId}&quot; does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - Row 1: Country Name + Export */}
      <header className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
        <SidebarTrigger />
        <CountryName name={displayName} />
        {isEdited && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Edited
          </span>
        )}
        </div>
        <Button onClick={handleExportPlan} variant="outline">
          Export Plan
        </Button>
      </header>

      {/* Main Content: Two columns below header */}
      <main className="flex-1 flex min-h-0 overflow-hidden relative">

         {/* Rules Sidebar - extends full height below header */}
         <RulesSidebar
          rules={savedRules}
          metricTypes={metricTypes}
          interventionCategories={interventionCategories ?? []}
          onAddRule={handleAddRule}
          onEditRule={handleEditRule}
          onDeleteRule={handleDeleteRule}
          onToggleVisibility={handleToggleRuleVisibility}
          onReorderRules={handleReorderRules}
          getDistrictName={getDistrictName}
          onGenerateFromGuidelines={handleGenerateFromGuidelines}
          isCumulativeMode={isCumulativeMode}
          onToggleCumulativeMode={setIsCumulativeMode}
        />

        {/* Left Column: Filter bar + Map */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filter bar - only above map */}
          <div className="px-6 py-3 border-b flex items-center justify-between">

          <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex items-center gap-2">
            <GeographicFilter
              provinces={provinces}
              selectedProvinceId={selectedProvince?.id ?? null}
              onProvinceChange={setSelectedProvince}
              isLoading={isLoading}
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              Compare
              <Switch
                checked={isComparisonOpen}
                onCheckedChange={toggleComparison}
              />
            </label>
          </div>
          </div>

          {/* View Container */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            <div className="flex-1 relative p-4 rounded-lg overflow-hidden min-h-0">
              {activeTab === "map" && (
                <InterventionMap
                  selectedProvince={selectedProvince}
                  highlightedDistrictIds={highlightedDistrictIds}
                  districts={districts}
                  onSelectMix={handleSelectMix}
                  metricValuesByOrgUnit={{
                    mortality: mortalityByOrgUnit,
                    incidence: incidenceByOrgUnit,
                    resistance: resistanceByOrgUnit,
                    seasonality: seasonalityByOrgUnit,
                  }}
                  hasRules={savedRules.length > 0}
                  onSetAsExceptions={(districtIds) => {
                    // Transpose metricValuesByType to the format expected by findRulesMatchingDistrict:
                    // from metricTypeId -> orgUnitId -> value to districtId -> metricTypeId -> value
                    const metricValuesByDistrict: Record<string, Record<number, number>> = {};
                    for (const [metricTypeId, valuesByOrgUnit] of Object.entries(metricValuesByType)) {
                      const typeId = Number(metricTypeId);
                      for (const [orgUnitId, value] of Object.entries(valuesByOrgUnit)) {
                        const districtId = String(orgUnitId);
                        if (!metricValuesByDistrict[districtId]) {
                          metricValuesByDistrict[districtId] = {};
                        }
                        metricValuesByDistrict[districtId][typeId] = value;
                      }
                    }

                    // Update savedRules - for each selected district, add it to matching rules' exceptions
                    // We use the functional form to get the latest state and compute the count
                    setSavedRules((prevRules) => {
                      let addedCount = 0;
                      const updatedRules = prevRules.map((rule) => {
                        // Find which selected districts match this rule's criteria
                        const districtsToExclude: string[] = [];
                        for (const districtId of districtIds) {
                          const matchingRuleIds = findRulesMatchingDistrict(
                            districtId,
                            [rule], // Check just this rule
                            metricValuesByDistrict
                          );
                          if (matchingRuleIds.includes(rule.id)) {
                            districtsToExclude.push(districtId);
                          }
                        }

                        // If no districts to exclude for this rule, return unchanged
                        if (districtsToExclude.length === 0) {
                          return rule;
                        }

                        // Add new exceptions (avoiding duplicates)
                        const existingExceptions = new Set(rule.excludedDistrictIds ?? []);
                        const newExceptions = districtsToExclude.filter((id) => !existingExceptions.has(id));

                        if (newExceptions.length === 0) {
                          return rule;
                        }

                        addedCount += newExceptions.length;

                        return {
                          ...rule,
                          excludedDistrictIds: [...(rule.excludedDistrictIds ?? []), ...newExceptions],
                        };
                      });

                      // Show toast notification after computing the count
                      // Use setTimeout to avoid calling toast during state update
                      setTimeout(() => {
                        if (addedCount > 0) {
                          toast.success(`${addedCount} district${addedCount === 1 ? "" : "s"} added to exceptions`);
                        } else {
                          toast.info("0 districts added to exceptions (no matching rules)");
                        }
                      }, 0);

                      return updatedRules;
                    });
                  }}
                  onRemoveFromExceptions={(districtIds) => {
                    // Update savedRules - for each selected district, remove it from all rules' exception lists
                    setSavedRules((prevRules) => {
                      let removedCount = 0;
                      const updatedRules = prevRules.map((rule) => {
                        // Find which selected districts are in this rule's exception list
                        const districtsToRemove = districtIds.filter((districtId) =>
                          findRulesWithDistrictAsException(districtId, [rule]).includes(rule.id)
                        );

                        // If no districts to remove for this rule, return unchanged
                        if (districtsToRemove.length === 0) {
                          return rule;
                        }

                        // Remove the districts from exceptions
                        const districtsToRemoveSet = new Set(districtsToRemove);
                        const newExcludedDistrictIds = (rule.excludedDistrictIds ?? []).filter(
                          (id) => !districtsToRemoveSet.has(id)
                        );

                        removedCount += districtsToRemove.length;

                        return {
                          ...rule,
                          excludedDistrictIds: newExcludedDistrictIds,
                        };
                      });

                      // Show toast notification after computing the count
                      // Use setTimeout to avoid calling toast during state update
                      setTimeout(() => {
                        if (removedCount > 0) {
                          toast.success(`${removedCount} district${removedCount === 1 ? "" : "s"} removed from exceptions`);
                        } else {
                          toast.info("0 districts removed from exceptions");
                        }
                      }, 0);

                      return updatedRules;
                    });
                  }}
                />
              )}
              {activeTab === "list" && (
                <ListView
                  districts={districts}
                  selectedProvince={selectedProvince}
                  interventionCategories={interventionCategories ?? []}
                  rules={savedRules}
                  metricValuesByType={metricValuesByType}
                />
              )}
              {activeTab === "budget" && (
                <BudgetView
                  districts={districts}
                  selectedProvince={selectedProvince}
                  interventionCategories={interventionCategories ?? []}
                />
              )}
            </div>

            {/* Comparison Sidebar - inside view container */}
            <ComparisonSidebar
              isOpen={isComparisonOpen}
              activeTab={activeTab}
              selectedProvince={selectedProvince}
            />
          </div>
        </div>

      </main>

      {/* Add Intervention Sheet */}
      <AddInterventionSheet
        isOpen={isSheetOpen}
        onOpenChange={handleSheetOpenChange}
        districts={districts}
        selectedProvince={selectedProvince}
        onHighlightDistricts={handleHighlightDistricts}
        onApplyInterventions={handleApplyInterventions}
        initialSelectionPayload={legendSelectionPayload}
      />

      {/* Rule Edit Modal */}
      <RuleEditModal
        isOpen={isRuleModalOpen}
        onOpenChange={handleRuleModalOpenChange}
        rule={editingRule}
        rulesCount={savedRules.length}
        metricTypes={metricTypes}
        groupedMetricTypes={metricTypes.reduce<Record<string, typeof metricTypes>>((acc, metric) => {
          const category = metric.category || "Other";
          if (!acc[category]) acc[category] = [];
          acc[category].push(metric);
          return acc;
        }, {})}
        interventionCategories={interventionCategories ?? []}
        onSave={handleSaveRule}
        getDistrictName={getDistrictName}
        districts={districts}
        metricValuesByType={metricValuesByType}
      />
    </div>
  );
}
