"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RuleBuilderStep } from "./rule-builder-step";
import { DistrictSelectionStep } from "./district-selection-step";
import { useMetricTypes } from "@/hooks/use-metric-types";
import { useInterventionCategories } from "@/hooks/use-intervention-categories";
import { useDistrictRules } from "@/hooks/use-district-rules";
import type { Rule, WizardStep, LegendSelectionPayload } from "@/types/intervention";
import type { DistrictProperties, Province } from "@/data/districts";

function generateRuleId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyRule(): Rule {
  return {
    id: generateRuleId(),
    metricTypeId: null,
    operator: ">=",
    value: "",
  };
}

interface AddInterventionSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  districts: GeoJSON.FeatureCollection<
    GeoJSON.MultiPolygon | GeoJSON.Polygon,
    DistrictProperties
  > | null;
  selectedProvince?: Province | null;
  onHighlightDistricts: (districtIds: string[]) => void;
  onApplyInterventions: (districtIds: string[], selectedInterventionsByCategory: Map<number, number>) => void;
  initialSelectionPayload?: LegendSelectionPayload | null;
}

export function AddInterventionSheet({
  isOpen,
  onOpenChange,
  districts,
  selectedProvince,
  onHighlightDistricts,
  onApplyInterventions,
  initialSelectionPayload,
}: AddInterventionSheetProps) {
  const [step, setStep] = useState<WizardStep>("rules");
  const [rules, setRules] = useState<Rule[]>([createEmptyRule()]);
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<Set<string>>(new Set());
  const [selectedInterventionIds, setSelectedInterventionIds] = useState<Set<number>>(new Set());
  const [selectedInterventionsByCategory, setSelectedInterventionsByCategory] = useState<Map<number, number>>(new Map());
  const [isFromLegend, setIsFromLegend] = useState(false);

  const { groupedByCategory, isLoading: metricsLoading } = useMetricTypes();
  const { data: interventionCategories, isLoading: interventionsLoading } = useInterventionCategories();
  const { matchingDistricts, matchingCount, hasCompleteRules } = useDistrictRules({
    districts,
    rules,
    selectedProvinceId: selectedProvince?.id ?? null,
  });

  // Handle opening with legend selection payload
  useEffect(() => {
    if (isOpen && initialSelectionPayload) {
      // Skip to selection step with pre-populated data
      setStep("selection");
      setSelectedDistrictIds(new Set(initialSelectionPayload.districtIds));
      setSelectedInterventionsByCategory(new Map(initialSelectionPayload.interventionsByCategory));
      setIsFromLegend(true);
    }
  }, [isOpen, initialSelectionPayload]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setStep("rules");
      setRules([createEmptyRule()]);
      setSelectedDistrictIds(new Set());
      setSelectedInterventionIds(new Set());
      setSelectedInterventionsByCategory(new Map());
      setIsFromLegend(false);
      onHighlightDistricts([]);
    }
  }, [isOpen, onHighlightDistricts]);

  // Update highlighted districts when selection changes during selection step
  useEffect(() => {
    if (step === "selection") {
      onHighlightDistricts(Array.from(selectedDistrictIds));
    }
  }, [step, selectedDistrictIds, onHighlightDistricts]);

  const handleUpdateRule = useCallback((ruleId: string, updates: Partial<Rule>) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  }, []);

  const handleDeleteRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  }, []);

  const handleAddRule = useCallback(() => {
    setRules((prev) => [...prev, createEmptyRule()]);
  }, []);

  const handleGoToSelection = useCallback(() => {
    // Select all matching districts by default
    setSelectedDistrictIds(new Set(matchingDistricts.map((d) => d.districtId)));
    setStep("selection");
  }, [matchingDistricts]);

  const handleToggleDistrict = useCallback((districtId: string) => {
    setSelectedDistrictIds((prev) => {
      const next = new Set(prev);
      if (next.has(districtId)) {
        next.delete(districtId);
      } else {
        next.add(districtId);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    const allSelected = matchingDistricts.every((d) =>
      selectedDistrictIds.has(d.districtId)
    );
    if (allSelected) {
      setSelectedDistrictIds(new Set());
    } else {
      setSelectedDistrictIds(new Set(matchingDistricts.map((d) => d.districtId)));
    }
  }, [matchingDistricts, selectedDistrictIds]);

  const handleToggleIntervention = useCallback((interventionId: number) => {
    setSelectedInterventionIds((prev) => {
      const next = new Set(prev);
      if (next.has(interventionId)) {
        next.delete(interventionId);
      } else {
        next.add(interventionId);
      }
      return next;
    });
  }, []);

  const handleSelectInterventionForCategory = useCallback((categoryId: number, interventionId: number | null) => {
    setSelectedInterventionsByCategory((prev) => {
      const next = new Map(prev);
      if (interventionId === null) {
        next.delete(categoryId);
      } else {
        next.set(categoryId, interventionId);
      }
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    // Pass the category-based selections directly
    onApplyInterventions(
      Array.from(selectedDistrictIds),
      selectedInterventionsByCategory
    );
    onOpenChange(false);
  }, [selectedDistrictIds, selectedInterventionsByCategory, onApplyInterventions, onOpenChange]);

  const getTitle = () => {
    switch (step) {
      case "rules":
        return "Add intervention";
      case "selection":
        return "Select districts & interventions";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[540px] sm:max-w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>{getTitle()}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 mt-4 overflow-hidden">
          {step === "rules" && (
            <RuleBuilderStep
              rules={rules}
              groupedMetricTypes={groupedByCategory}
              isLoading={metricsLoading}
              hasCompleteRules={hasCompleteRules}
              matchingCount={matchingCount}
              onUpdateRule={handleUpdateRule}
              onDeleteRule={handleDeleteRule}
              onAddRule={handleAddRule}
              onNext={handleGoToSelection}
            />
          )}

          {step === "selection" && (
            <DistrictSelectionStep
              matchingDistricts={matchingDistricts}
              selectedDistrictIds={selectedDistrictIds}
              interventionCategories={interventionCategories}
              interventionsLoading={interventionsLoading}
              selectedInterventionIds={selectedInterventionIds}
              selectedInterventionsByCategory={selectedInterventionsByCategory}
              onToggleDistrict={handleToggleDistrict}
              onToggleAll={handleToggleAll}
              onToggleIntervention={handleToggleIntervention}
              onSelectInterventionForCategory={handleSelectInterventionForCategory}
              onBack={() => setStep("rules")}
              onApply={handleApply}
              isFromLegendSelection={isFromLegend}
              onClose={() => onOpenChange(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
