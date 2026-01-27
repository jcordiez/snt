"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  // Generate a stable ID for aria-controls
  const contentId = React.useId();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-2 text-sm font-medium",
          "hover:bg-accent/50 rounded-md px-2 py-1.5 -mx-2",
          "transition-colors cursor-pointer"
        )}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-150 ease-out",
            !isOpen && "-rotate-90"
          )}
          aria-hidden="true"
        />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent
        id={contentId}
        className={cn(
          "overflow-hidden",
          "data-[state=open]:animate-collapsible-down",
          "data-[state=closed]:animate-collapsible-up"
        )}
      >
        <div className="pt-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
