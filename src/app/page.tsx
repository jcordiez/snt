"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { AddInterventionSheet } from "@/components/intervention-map/add-intervention";
import { RulesSidebar, RuleEditModal } from "@/components/intervention-map/rules-sidebar";
import { Province } from "@/data/districts";
import { useOrgUnits, createInterventionMix } from "@/hooks/use-orgunits";
import { useInterventionCategories } from "@/hooks/use-intervention-categories";
import { useMetricTypes } from "@/hooks/use-metric-types";
import { useMetricValues } from "@/hooks/use-metric-values";
import { useMultipleMetricValues } from "@/hooks/use-multiple-metric-values";
import { findMatchingDistrictIds, findRulesMatchingDistrict, findRulesWithDistrictAsException } from "@/hooks/use-district-rules";
import { LegendSelectionPayload } from "@/types/intervention";
import type { SavedRule } from "@/types/rule";
import type { Rule } from "@/types/intervention";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";

// All metric IDs that have data files available - defined outside component
// to maintain stable reference and prevent infinite re-fetch loops
const ALL_METRIC_IDS_WITH_DATA = [404, 406, 407, 410, 412, 413];

export default function Home() {
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

  // Pre-load all metric values that have data files (eliminates race condition)
  const { metricValuesByType } = useMultipleMetricValues(ALL_METRIC_IDS_WITH_DATA);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [highlightedDistrictIds, setHighlightedDistrictIds] = useState<string[]>([]);
  const [legendSelectionPayload, setLegendSelectionPayload] = useState<LegendSelectionPayload | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const defaultRuleInitialized = useRef(false);

  // Initialize default rule on load
  useEffect(() => {
    if (
      defaultRuleInitialized.current ||
      !districts?.features.length ||
      !interventionCategories?.length
    ) {
      return;
    }

    defaultRuleInitialized.current = true;

    // Default rule spec from PRD:
    // - CM (category 37, intervention 78)
    // - Standard Pyrethroid Campaign (category 40, intervention 85)
    // - Standard Pyrethroid Routine (category 41, intervention 88)
    const defaultInterventions = new Map<number, number>([
      [37, 78], // CM
      [40, 85], // Standard Pyrethroid Campaign
      [41, 88], // Standard Pyrethroid Routine
    ]);

    const defaultRule: SavedRule = {
      id: "default-rule",
      title: "Default",
      color: "#9ca3af",
      criteria: [],
      interventionsByCategory: defaultInterventions,
      isAllDistricts: true,
    };

    setSavedRules([defaultRule]);

    // Apply the default rule to all districts
    const allDistrictIds = districts.features.map((f) => f.properties.districtId);
    const interventionMix = createInterventionMix(
      defaultInterventions,
      interventionCategories
    );

    updateDistricts(allDistrictIds, interventionMix, interventionCategories, {
      replace: false,
      ruleColor: defaultRule.color,
    });

    console.log("Default rule initialized:", {
      ruleId: defaultRule.id,
      ruleTitle: defaultRule.title,
      ruleColor: defaultRule.color,
      appliedToDistricts: allDistrictIds.length,
      interventionMix: interventionMix.displayLabel,
    });
  }, [districts, interventionCategories, updateDistricts]);

  // Re-apply all rules whenever savedRules changes (handles edits, deletions, reordering)
  const prevSavedRulesRef = useRef<string>("");
  useEffect(() => {
    // Skip if no districts or intervention categories loaded yet
    if (!districts?.features.length || !interventionCategories?.length) {
      return;
    }

    // Serialize rules to detect actual changes (not just reference changes)
    const rulesKey = JSON.stringify(
      savedRules.map((r) => ({
        id: r.id,
        criteria: r.criteria,
        interventionsByCategory: Array.from(r.interventionsByCategory.entries()),
        coverageByCategory: r.coverageByCategory ? Array.from(r.coverageByCategory.entries()) : [],
        isAllDistricts: r.isAllDistricts,
        color: r.color,
        excludedDistrictIds: r.excludedDistrictIds,
      }))
    );

    // Skip if rules haven't actually changed
    if (rulesKey === prevSavedRulesRef.current) {
      return;
    }
    prevSavedRulesRef.current = rulesKey;

    console.log("Re-applying all rules due to savedRules change:", savedRules.length, "rules");

    // Find the default rule (isAllDistricts=true, usually first) to reset all districts first
    const defaultRule = savedRules.find((r) => r.isAllDistricts);
    const nonDefaultRules = savedRules.filter((r) => !r.isAllDistricts);

    // First, apply default rule to all districts (this resets any deleted rule's effects)
    if (defaultRule && defaultRule.interventionsByCategory.size > 0) {
      const allDistrictIds = districts.features
        .filter((f) =>
          selectedProvince
            ? f.properties.regionId === selectedProvince.id
            : true
        )
        .map((f) => f.properties.districtId);

      const defaultMix = createInterventionMix(
        defaultRule.interventionsByCategory,
        interventionCategories
      );

      updateDistricts(
        allDistrictIds,
        defaultMix,
        interventionCategories,
        { replace: false, ruleColor: defaultRule.color }
      );

      console.log("Reset all districts to default rule:", defaultRule.title);
    }

    // Then apply non-default rules in order (later rules override earlier for overlapping districts)
    for (const rule of nonDefaultRules) {
      const rulesForEvaluation: Rule[] = rule.criteria.map((criterion) => ({
        id: criterion.id,
        metricTypeId: criterion.metricTypeId,
        operator: criterion.operator,
        value: criterion.value,
      }));

      const matchingDistrictIds = findMatchingDistrictIds(
        districts,
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
          interventionCategories
        );

        updateDistricts(
          finalDistrictIds,
          interventionMix,
          interventionCategories,
          { replace: false, ruleColor: rule.color }
        );

        console.log("Re-applied rule:", rule.title, "to", finalDistrictIds.length, "districts");
      }
    }
  }, [savedRules, districts, selectedProvince, interventionCategories, updateDistricts, metricValuesByType]);

  const displayName = "NSP 2026-2030"; //selectedProvince?.name ?? countryConfig.name;

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

  const handleEditRule = useCallback((ruleId: string) => {
    setEditingRuleId(ruleId);
    setIsRuleModalOpen(true);
  }, []);

  const handleDeleteRule = useCallback((ruleId: string) => {
    setSavedRules((prev) => prev.filter((r) => r.id !== ruleId));
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
    link.setAttribute("href", url);
    link.setAttribute("download", `intervention-plan-${date}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [districts, interventionCategories]);

  return (
    <div className="flex flex-col h-full">
      {/* Header - Row 1: Country Name + Export */}
      <header className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
        <SidebarTrigger />
        <CountryName name={displayName} />
        </div>
        <Button onClick={handleExportPlan} variant="outline">
          Export Plan
        </Button>
      </header>

      {/* Main Content: Two columns below header */}
      <main className="flex-1 flex min-h-0">
        {/* Left Column: Filter bar + Map */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filter bar - only above map */}
          <div className="px-6 py-3 border-b flex items-center justify-between">
            <GeographicFilter
              provinces={provinces}
              selectedProvinceId={selectedProvince?.id ?? null}
              onProvinceChange={setSelectedProvince}
              isLoading={isLoading}
            />
            <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* View Container */}
          <div className="flex-1 relative p-4 rounded-lg">
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
        </div>

        {/* Rules Sidebar - extends full height below header */}
        <RulesSidebar
          rules={savedRules}
          metricTypes={metricTypes}
          interventionCategories={interventionCategories ?? []}
          onAddRule={handleAddRule}
          onEditRule={handleEditRule}
          onDeleteRule={handleDeleteRule}
          getDistrictName={getDistrictName}
        />
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
