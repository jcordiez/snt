"use client";

import { Slider } from "@/components/ui/slider";
import { BUDGET_YEARS } from "./cost-data";

interface YearRangeSelectorProps {
  /** Start year index (0-based) */
  startYearIndex: number;
  /** End year index (0-based) */
  endYearIndex: number;
  /** Callback when range changes */
  onChange: (startYearIndex: number, endYearIndex: number) => void;
}

export function YearRangeSelector({
  startYearIndex,
  endYearIndex,
  onChange,
}: YearRangeSelectorProps) {
  const handleValueChange = (value: number[]) => {
    onChange(value[0], value[1]);
  };

  const startYear = BUDGET_YEARS.start + startYearIndex;
  const endYear = BUDGET_YEARS.start + endYearIndex;

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        {startYear} - {endYear}
      </span>
      <Slider
        value={[startYearIndex, endYearIndex]}
        min={0}
        max={BUDGET_YEARS.count - 1}
        step={1}
        onValueChange={handleValueChange}
        className="flex-1"
      />
    </div>
  );
}
