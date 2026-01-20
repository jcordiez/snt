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
import { InterventionSelectionStep } from "./intervention-selection-step";
import { useMetricTypes } from "@/hooks/use-metric-types";
import { useInterventionCategories } from "@/hooks/use-intervention-categories";
import { useDistrictRules } from "@/hooks/use-district-rules";
import type { Rule, WizardStep } from "@/types/intervention";
import type { DistrictProperties } from "@/data/districts";

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
  onHighlightDistricts: (districtIds: string[]) => void;
  onApplyInterventions: (districtIds: string[], interventionIds: number[]) => void;
}

export function AddInterventionSheet({
  isOpen,
  onOpenChange,
  districts,
  onHighlightDistricts,
  onApplyInterventions,
}: AddInterventionSheetProps) {
  const [step, setStep] = useState<WizardStep>("rules");
  const [rules, setRules] = useState<Rule[]>([createEmptyRule()]);
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<Set<string>>(new Set());
  const [selectedInterventionIds, setSelectedInterventionIds] = useState<Set<number>>(new Set());

  const { groupedByCategory, isLoading: metricsLoading } = useMetricTypes();
  const { data: interventionCategories, isLoading: interventionsLoading } = useInterventionCategories();
  const { matchingDistricts, hasCompleteRules } = useDistrictRules({ districts, rules });

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setStep("rules");
      setRules([createEmptyRule()]);
      setSelectedDistrictIds(new Set());
      setSelectedInterventionIds(new Set());
      onHighlightDistricts([]);
    }
  }, [isOpen, onHighlightDistricts]);

  // Update highlighted districts when selection changes during district selection step
  useEffect(() => {
    if (step === "districts") {
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

  const handleGoToDistricts = useCallback(() => {
    // Select all matching districts by default
    setSelectedDistrictIds(new Set(matchingDistricts.map((d) => d.districtId)));
    setStep("districts");
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

  const handleGoToInterventions = useCallback(() => {
    setStep("interventions");
  }, []);

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

  const handleApply = useCallback(() => {
    onApplyInterventions(
      Array.from(selectedDistrictIds),
      Array.from(selectedInterventionIds)
    );
    onOpenChange(false);
  }, [selectedDistrictIds, selectedInterventionIds, onApplyInterventions, onOpenChange]);

  const getTitle = () => {
    switch (step) {
      case "rules":
        return "Add intervention";
      case "districts":
        return "Select districts";
      case "interventions":
        return "Select interventions";
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
              onUpdateRule={handleUpdateRule}
              onDeleteRule={handleDeleteRule}
              onAddRule={handleAddRule}
              onNext={handleGoToDistricts}
            />
          )}

          {step === "districts" && (
            <DistrictSelectionStep
              matchingDistricts={matchingDistricts}
              selectedDistrictIds={selectedDistrictIds}
              onToggleDistrict={handleToggleDistrict}
              onToggleAll={handleToggleAll}
              onBack={() => setStep("rules")}
              onNext={handleGoToInterventions}
            />
          )}

          {step === "interventions" && (
            <InterventionSelectionStep
              categories={interventionCategories}
              isLoading={interventionsLoading}
              selectedInterventionIds={selectedInterventionIds}
              onToggleIntervention={handleToggleIntervention}
              onBack={() => setStep("districts")}
              onApply={handleApply}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
