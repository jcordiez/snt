"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  groupedMetricTypes: Record<string, MetricType[]>;
  onUpdate: (id: string, updates: Partial<RuleCriterion>) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

function CriterionRow({
  criterion,
  groupedMetricTypes,
  onUpdate,
  onDelete,
  canDelete,
}: CriterionRowProps) {
  const { min, max, isLoading } = useMetricValues(criterion.metricTypeId);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 group">
        <Select
          value={criterion.metricTypeId?.toString() ?? ""}
          onValueChange={(value) => onUpdate(criterion.id, { metricTypeId: parseInt(value, 10) })}
        >
          <SelectTrigger className="flex-1 min-w-[180px]">
            <SelectValue placeholder="Select variable..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedMetricTypes).map(([category, metrics]) => (
              <SelectGroup key={category}>
                <SelectLabel>{category}</SelectLabel>
                {metrics.map((metric) => (
                  <SelectItem key={metric.id} value={metric.id.toString()}>
                    {metric.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

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

        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(criterion.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {criterion.metricTypeId !== null && (
        <p className="text-xs text-muted-foreground pl-1">
          {isLoading ? (
            "Loading range..."
          ) : min !== null && max !== null ? (
            <>Min: {formatNumber(min)} – Max: {formatNumber(max)}</>
          ) : null}
        </p>
      )}
    </div>
  );
}

interface RuleEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  rule: SavedRule | null;
  metricTypes: MetricType[];
  groupedMetricTypes: Record<string, MetricType[]>;
  interventionCategories: InterventionCategory[];
  onSave: (rule: SavedRule) => void;
}

export function RuleEditModal({
  isOpen,
  onOpenChange,
  rule,
  metricTypes: _metricTypes,
  groupedMetricTypes,
  interventionCategories,
  onSave,
}: RuleEditModalProps) {
  void _metricTypes;

  const [title, setTitle] = useState("");
  const [criteria, setCriteria] = useState<RuleCriterion[]>([createEmptyCriterion()]);
  const [interventionsByCategory, setInterventionsByCategory] = useState<Map<number, number>>(new Map());

  // Reset form when modal opens or rule changes
  useEffect(() => {
    if (isOpen) {
      if (rule) {
        setTitle(rule.title);
        setCriteria(rule.criteria.length > 0 ? [...rule.criteria] : [createEmptyCriterion()]);
        setInterventionsByCategory(new Map(rule.interventionsByCategory));
      } else {
        setTitle("");
        setCriteria([createEmptyCriterion()]);
        setInterventionsByCategory(new Map());
      }
    }
  }, [isOpen, rule]);

  const handleUpdateCriterion = useCallback((id: string, updates: Partial<RuleCriterion>) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const handleDeleteCriterion = useCallback((id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleAddCriterion = useCallback(() => {
    setCriteria((prev) => [...prev, createEmptyCriterion()]);
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
  }, []);

  const handleSave = useCallback(() => {
    const validCriteria = criteria.filter(
      (c) => c.metricTypeId !== null && c.value !== ""
    );

    const savedRule: SavedRule = {
      id: rule?.id ?? generateId(),
      title: title.trim() || "Untitled Rule",
      criteria: validCriteria,
      interventionsByCategory: new Map(interventionsByCategory),
    };

    onSave(savedRule);
    onOpenChange(false);
  }, [rule, title, criteria, interventionsByCategory, onSave, onOpenChange]);

  const isEditing = rule !== null;
  const hasValidCriteria = criteria.some((c) => c.metricTypeId !== null && c.value !== "");
  const hasInterventions = interventionsByCategory.size > 0;
  const canSave = hasValidCriteria && hasInterventions;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rule" : "Create Rule"}</DialogTitle>
          <DialogDescription>
            Define criteria to select districts and assign interventions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Title input */}
          <div>
            <label htmlFor="rule-title" className="text-sm font-medium mb-2 block">
              Rule Name
            </label>
            <Input
              id="rule-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter rule name..."
            />
          </div>

          {/* Criteria section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Selection Criteria</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Districts matching ALL criteria will be selected.
            </p>
            <div className="space-y-3">
              {criteria.map((criterion) => (
                <CriterionRow
                  key={criterion.id}
                  criterion={criterion}
                  groupedMetricTypes={groupedMetricTypes}
                  onUpdate={handleUpdateCriterion}
                  onDelete={handleDeleteCriterion}
                  canDelete={criteria.length > 1}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCriterion}
              className="mt-3"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Criterion
            </Button>
          </div>

          {/* Interventions section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Assign Interventions</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Select one intervention per category. Categories without a selection will not be included.
            </p>
            <div className="space-y-4">
              {interventionCategories.map((category) => {
                const selectedValue = interventionsByCategory.get(category.id);
                return (
                  <div key={category.id}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {category.name}
                    </h4>
                    <RadioGroup
                      value={selectedValue?.toString() ?? ""}
                      onValueChange={(value) => {
                        if (value === "") {
                          handleSelectIntervention(category.id, null);
                        } else {
                          handleSelectIntervention(category.id, parseInt(value, 10));
                        }
                      }}
                      className="pl-2"
                    >
                      {category.interventions.map((intervention) => {
                        const isSelected = selectedValue === intervention.id;
                        return (
                          <div
                            key={intervention.id}
                            className="flex items-start gap-2"
                          >
                            <RadioGroupItem
                              value={intervention.id.toString()}
                              id={`modal-intervention-${intervention.id}`}
                            />
                            <label
                              htmlFor={`modal-intervention-${intervention.id}`}
                              className="cursor-pointer flex-1"
                            >
                              <div className="text-sm">{intervention.name}</div>
                              {intervention.description && (
                                <div className="text-xs text-muted-foreground">
                                  {intervention.description}
                                </div>
                              )}
                            </label>
                            {isSelected && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleSelectIntervention(category.id, null);
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                );
              })}
            </div>
          </div>
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
