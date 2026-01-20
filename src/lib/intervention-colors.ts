/**
 * Shared color generation utilities for intervention mix visualization.
 * Used by both map-legend.tsx and district-layer.tsx to ensure synchronized colors.
 */

/**
 * Generates a deterministic color based on a string hash.
 * Uses HSL color space to ensure good saturation and lightness.
 */
export function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use absolute value and map to hue (0-360)
  const hue = Math.abs(hash) % 360;
  // Fixed saturation and lightness for good visibility
  const saturation = 65;
  const lightness = 55;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Predefined color palette for common intervention mixes.
 * Provides consistent colors for frequently-used combinations.
 */
export const PREDEFINED_INTERVENTION_COLORS: Record<string, string> = {
  "CM": "#4ade80",           // Green - base case management
  "None": "#e5e7eb",         // Gray - no interventions
};

/**
 * Gets a color for an intervention mix, using predefined colors when available.
 * Falls back to deterministic color generation based on the mix label string.
 */
export function getColorForInterventionMix(mixLabel: string): string {
  return PREDEFINED_INTERVENTION_COLORS[mixLabel] ?? generateColorFromString(mixLabel);
}
