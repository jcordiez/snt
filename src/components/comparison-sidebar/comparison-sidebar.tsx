"use client";

import { memo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PREDEFINED_PLANS, type PlanDefinition } from "@/data/predefined-plans";
import { MiniatureMap } from "./miniature-map";

interface ComparisonSidebarProps {
  /** Whether the sidebar is visible */
  isOpen: boolean;
  /** Callback to close the sidebar */
  onClose: () => void;
  /** The ID of the currently loaded plan (null for new plans) */
  currentPlanId: string | null;
  /** Whether the current plan has been edited from its original state */
  isEdited: boolean;
}

export function ComparisonSidebar({
  isOpen,
  onClose,
  currentPlanId,
  isEdited,
}: ComparisonSidebarProps) {
  return (
    <div
      className={`w-80 border-l flex flex-col h-full bg-background transition-[margin] duration-300 ease-in-out shrink-0 ${
        isOpen ? "mr-0" : "-mr-80"
      } max-lg:absolute max-lg:right-0 max-lg:top-0 max-lg:z-10 max-lg:shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">Compare with</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable list of plans — only render maps when sidebar is visible */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {PREDEFINED_PLANS.map((plan) => (
            <PlanComparisonCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={plan.id === currentPlanId}
              isEdited={plan.id === currentPlanId && isEdited}
              renderMap={isOpen}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PlanComparisonCardProps {
  plan: PlanDefinition;
  isCurrentPlan: boolean;
  isEdited: boolean;
  renderMap: boolean;
}

const PlanComparisonCard = memo(function PlanComparisonCard({
  plan,
  isCurrentPlan,
  isEdited,
  renderMap,
}: PlanComparisonCardProps) {
  return (
    <div
      className={`border rounded-lg overflow-hidden bg-card ${
        isCurrentPlan ? "ring-2 ring-primary" : ""
      }`}
    >
      {/* Card Header */}
      <div className="px-3 py-2 border-b flex items-center gap-2">
        <span className="text-sm font-medium">{plan.name}</span>
        {isEdited && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Edited
          </span>
        )}
      </div>

      {/* Only mount MapLibre instances when sidebar is visible */}
      {renderMap ? (
        <MiniatureMap plan={plan} />
      ) : (
        <div className="aspect-[4/3] bg-muted" />
      )}
    </div>
  );
});
