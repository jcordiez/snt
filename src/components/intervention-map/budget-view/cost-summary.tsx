"use client";

interface CostSummaryProps {
  totalCost: number;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export function CostSummary({ totalCost }: CostSummaryProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 bg-muted/30 rounded-lg">
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Total Cost
      </span>
      <span className="text-4xl font-bold mt-2">
        {formatCurrency(totalCost)}
      </span>
    </div>
  );
}
