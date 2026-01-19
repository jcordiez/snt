"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Province } from "@/data/districts";

interface GeographicFilterProps {
  provinces: Province[];
  selectedProvinceId: string | null;
  onProvinceChange: (province: Province | null) => void;
  isLoading?: boolean;
}

const ALL_PROVINCES_VALUE = "all";

export function GeographicFilter({
  provinces,
  selectedProvinceId,
  onProvinceChange,
  isLoading = false,
}: GeographicFilterProps) {
  const handleValueChange = (value: string) => {
    if (value === ALL_PROVINCES_VALUE) {
      onProvinceChange(null);
    } else {
      const province = provinces.find((p) => p.id === value);
      onProvinceChange(province ?? null);
    }
  };

  return (
    <Select
      value={selectedProvinceId ?? ALL_PROVINCES_VALUE}
      onValueChange={handleValueChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filter by province..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_PROVINCES_VALUE}>All Provinces</SelectItem>
        {provinces.map((province) => (
          <SelectItem key={province.id} value={province.id}>
            {province.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
