"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PREDEFINED_PLANS, type PlanDefinition } from "@/data/predefined-plans";

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
  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-80 border-l flex flex-col h-full bg-background">
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

      {/* Scrollable list of plans */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {PREDEFINED_PLANS.map((plan) => (
            <PlanComparisonCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={plan.id === currentPlanId}
              isEdited={plan.id === currentPlanId && isEdited}
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
}

function PlanComparisonCard({
  plan,
  isCurrentPlan,
  isEdited,
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

      {/* Map Placeholder - will be replaced with miniature map in Phase 4 */}
      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Map preview</span>
      </div>
    </div>
  );
}
