"use client";

import { Button } from "@/components/ui/button";

interface AddInterventionButtonProps {
  onClick: () => void;
}

export function AddInterventionButton({ onClick }: AddInterventionButtonProps) {
  return (
    <Button onClick={onClick}>
      Add intervention
    </Button>
  );
}
