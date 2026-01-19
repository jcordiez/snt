"use client";

import { legendItems } from "@/data/districts";

interface LegendItem {
  color: string;
  label: string;
}

interface MapLegendProps {
  items?: LegendItem[];
}

export function MapLegend({ items = legendItems }: MapLegendProps) {
  return (
    <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 border border-gray-200">
      <div className="text-xs font-semibold text-gray-700 mb-1.5">
        Intervention Status
      </div>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0 border border-gray-300"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
