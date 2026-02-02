"use client";

import * as React from "react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  action?: React.ReactNode;
  step?: number;
}

export function CollapsibleSection({
  title,
  children,
  className,
  action,
  step,
}: CollapsibleSectionProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {step !== undefined && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700 text-white text-xs font-medium shrink-0">
              {step}
            </span>
          )}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="pt-3">{children}</div>
    </div>
  );
}
