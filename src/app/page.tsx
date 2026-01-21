"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  InterventionMap,
  CountryName,
  GeographicFilter,
} from "@/components/intervention-map";
import { Button } from "@/components/ui/button";
import {
  AddInterventionButton,
  AddInterventionSheet,
} from "@/components/intervention-map/add-intervention";
import { RulesSidebar, RuleEditModal } from "@/components/intervention-map/rules-sidebar";
import { Province } from "@/data/districts";
import { useOrgUnits, createInterventionMix } from "@/hooks/use-orgunits";
import { useInterventionCategories } from "@/hooks/use-intervention-categories";
import { useMetricTypes } from "@/hooks/use-metric-types";
import { findMatchingDistrictIds } from "@/hooks/use-district-rules";
import { LegendSelectionPayload } from "@/types/intervention";
import type { SavedRule } from "@/types/rule";
import type { Rule } from "@/types/intervention";

export default function Home() {
  const { data: districts, provinces, isLoading, updateDistricts } = useOrgUnits();
  const { data: interventionCategories } = useInterventionCategories();
  const { data: metricTypes } = useMetricTypes();
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [highlightedDistrictIds, setHighlightedDistrictIds] = useState<string[]>([]);
  const [legendSelectionPayload, setLegendSelectionPayload] = useState<LegendSelectionPayload | null>(null);
  const [savedRules, setSavedRules] = useState<SavedRule[]>([]);
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
    // Update the saved rules state
    setSavedRules((prev) => {
      const existingIndex = prev.findIndex((r) => r.id === rule.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = rule;
        return updated;
      }
      return [...prev, rule];
    });

    let matchingDistrictIds: string[];

    if (rule.isAllDistricts) {
      // For "all districts" rules, match all districts (optionally filtered by province)
      matchingDistrictIds = districts?.features
        .filter((f) =>
          selectedProvince
            ? f.properties.regionId === selectedProvince.id
            : true
        )
        .map((f) => f.properties.districtId) ?? [];
      console.log("handleSaveRule: isAllDistricts rule, matching all districts:", matchingDistrictIds.length);
    } else {
      // Convert SavedRule criteria to Rule[] format for evaluation
      const rulesForEvaluation: Rule[] = rule.criteria.map((criterion) => ({
        id: criterion.id,
        metricTypeId: criterion.metricTypeId,
        operator: criterion.operator,
        value: criterion.value,
      }));

      // Debug: Log criteria being used for matching
      console.log("handleSaveRule: criteria for evaluation:", rulesForEvaluation);
      console.log("handleSaveRule: total districts:", districts?.features.length);

      // Find districts matching the rule's criteria
      matchingDistrictIds = findMatchingDistrictIds(
        districts,
        rulesForEvaluation,
        selectedProvince?.id ?? null
      );

      // Debug: Log matching results
      console.log("handleSaveRule: matching district count:", matchingDistrictIds.length);
      console.log("handleSaveRule: first 5 matching IDs:", matchingDistrictIds.slice(0, 5));
    }

    // Only update if there are matching districts and interventions selected
    if (matchingDistrictIds.length > 0 && rule.interventionsByCategory.size > 0) {
      const interventionMix = createInterventionMix(
        rule.interventionsByCategory,
        interventionCategories ?? []
      );

      console.log("handleSaveRule: applying color", rule.color, "to", matchingDistrictIds.length, "districts");

      updateDistricts(
        matchingDistrictIds,
        interventionMix,
        interventionCategories ?? [],
        { replace: false, ruleColor: rule.color }
      );

      console.log("Rule applied:", {
        ruleId: rule.id,
        ruleTitle: rule.title,
        ruleColor: rule.color,
        matchingDistricts: matchingDistrictIds.length,
        interventionMix: interventionMix.displayLabel,
      });
    } else {
      console.log("handleSaveRule: no districts updated - matching:", matchingDistrictIds.length, "interventions:", rule.interventionsByCategory.size);
    }
  }, [districts, selectedProvince, interventionCategories, updateDistricts]);

  const handleRuleModalOpenChange = useCallback((open: boolean) => {
    setIsRuleModalOpen(open);
    if (!open) {
      setEditingRuleId(null);
    }
  }, []);

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
    <div className="flex flex-col h-screen">
      {/* Header - Row 1: Country Name + Export */}
      <header className="px-6 py-4 border-b flex items-center justify-between">
        <CountryName name={displayName} />
        <Button onClick={handleExportPlan} variant="outline">
          Export Plan
        </Button>
      </header>

      {/* Header - Row 2: Filters and Actions */}
      <div className="px-6 py-3 border-b flex items-center justify-between">
        <GeographicFilter
          provinces={provinces}
          selectedProvinceId={selectedProvince?.id ?? null}
          onProvinceChange={setSelectedProvince}
          isLoading={isLoading}
        />
        <AddInterventionButton onClick={() => setIsSheetOpen(true)} />
      </div>

      {/* Main Content: Map + Rules Sidebar */}
      <main className="flex-1 flex min-h-0">
        {/* Map Container */}
        <div className="flex-1 relative">
          <InterventionMap
            selectedProvince={selectedProvince}
            highlightedDistrictIds={highlightedDistrictIds}
            districts={districts}
            onSelectMix={handleSelectMix}
          />
        </div>

        {/* Rules Sidebar */}
        <RulesSidebar
          rules={savedRules}
          metricTypes={metricTypes}
          interventionCategories={interventionCategories ?? []}
          onAddRule={handleAddRule}
          onEditRule={handleEditRule}
          onDeleteRule={handleDeleteRule}
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
      />
    </div>
  );
}
