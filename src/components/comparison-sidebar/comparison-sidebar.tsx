"use client";

import { memo } from "react";
import { PREDEFINED_PLANS, type PlanDefinition } from "@/data/predefined-plans";
import { MiniatureMap } from "./miniature-map";
import { MiniatureBudget } from "./miniature-budget";
import type { ViewTab } from "@/components/intervention-map";
import type { Province } from "@/data/districts";

interface ComparisonSidebarProps {
  isOpen: boolean;
  activeTab: ViewTab;
  selectedProvince?: Province | null;
}

export function ComparisonSidebar({
  isOpen,
  activeTab,
  selectedProvince,
}: ComparisonSidebarProps) {
  // Determine display type based on active tab
  const displayType = activeTab === "budget" ? "cost" : "intervention";

  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-[450px] border-l flex flex-col min-h-0 shrink-0">
      {/* Plans list - fills remaining height, each card takes equal space */}
      <div className="flex-1 flex flex-col min-h-0 p-3 gap-3 overflow-y-auto">
        {PREDEFINED_PLANS.map((plan) => (
          <PlanComparisonCard
            key={plan.id}
            plan={plan}
            renderContent={isOpen}
            displayType={displayType}
            selectedProvince={selectedProvince}
          />
        ))}
      </div>
    </div>
  );
}

type DisplayType = "intervention" | "cost";

interface PlanComparisonCardProps {
  plan: PlanDefinition;
  renderContent: boolean;
  displayType: DisplayType;
  selectedProvince?: Province | null;
}

const PlanComparisonCard = memo(function PlanComparisonCard({
  plan,
  renderContent,
  displayType,
  selectedProvince,
}: PlanComparisonCardProps) {
  return (
    <div className="flex-1 border rounded-lg overflow-hidden bg-card flex flex-col min-h-0">
     

      {/* Content area - fills remaining space */}
      <div className="flex-1 min-h-0">
        {displayType === "intervention" ? (
          renderContent ? (
            <MiniatureMap plan={plan} selectedProvince={selectedProvince} />
          ) : (
            <div className="h-full bg-muted" />
          )
        ) : (
          renderContent ? (
            <MiniatureBudget plan={plan} />
          ) : (
            <div className="h-full bg-muted" />
          )
        )}
      </div>

       {/* Card Header */}
       <div className="px-3 py-1.5 border-b flex items-center gap-2 shrink-0">
        <span className="text-xs font-medium">{plan.name}</span>
      </div>
    </div>
  );
});
