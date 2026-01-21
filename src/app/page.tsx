"use client";

import { useState, useCallback } from "react";
import {
  InterventionMap,
  CountryName,
  GeographicFilter,
} from "@/components/intervention-map";
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

    // Convert SavedRule criteria to Rule[] format for evaluation
    const rulesForEvaluation: Rule[] = rule.criteria.map((criterion) => ({
      id: criterion.id,
      metricTypeId: criterion.metricTypeId,
      operator: criterion.operator,
      value: criterion.value,
    }));

    // Find districts matching the rule's criteria
    const matchingDistrictIds = findMatchingDistrictIds(
      districts,
      rulesForEvaluation,
      selectedProvince?.id ?? null
    );

    // Only update if there are matching districts and interventions selected
    if (matchingDistrictIds.length > 0 && rule.interventionsByCategory.size > 0) {
      const interventionMix = createInterventionMix(
        rule.interventionsByCategory,
        interventionCategories ?? []
      );

      updateDistricts(
        matchingDistrictIds,
        interventionMix,
        interventionCategories ?? [],
        { replace: false }
      );

      console.log("Rule applied:", {
        ruleId: rule.id,
        ruleTitle: rule.title,
        matchingDistricts: matchingDistrictIds.length,
        interventionMix: interventionMix.displayLabel,
      });
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

  return (
    <div className="flex flex-col h-screen">
      {/* Header - Row 1: Country Name */}
      <header className="px-6 py-4 border-b">
        <CountryName name={displayName} />
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
