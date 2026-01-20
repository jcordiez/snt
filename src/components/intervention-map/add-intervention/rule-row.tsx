"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Rule, RuleOperator, MetricType } from "@/types/intervention";

const OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: "<", label: "<" },
  { value: "<=", label: "<=" },
  { value: "=", label: "=" },
  { value: ">=", label: ">=" },
  { value: ">", label: ">" },
];

interface RuleRowProps {
  rule: Rule;
  groupedMetricTypes: Record<string, MetricType[]>;
  onUpdate: (ruleId: string, updates: Partial<Rule>) => void;
  onDelete: (ruleId: string) => void;
  canDelete: boolean;
}

export function RuleRow({
  rule,
  groupedMetricTypes,
  onUpdate,
  onDelete,
  canDelete,
}: RuleRowProps) {
  const handleMetricChange = (value: string) => {
    onUpdate(rule.id, { metricTypeId: parseInt(value, 10) });
  };

  const handleOperatorChange = (value: string) => {
    onUpdate(rule.id, { operator: value as RuleOperator });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(rule.id, { value: e.target.value });
  };

  return (
    <div className="flex items-center gap-2 group">
      <Select
        value={rule.metricTypeId?.toString() ?? ""}
        onValueChange={handleMetricChange}
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

      <Select value={rule.operator} onValueChange={handleOperatorChange}>
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
        value={rule.value}
        onChange={handleValueChange}
        placeholder="Value"
        className="w-[100px]"
      />

      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(rule.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
