/**
 * Shared color generation utilities for intervention mix visualization.
 * Used by both map-legend.tsx and district-layer.tsx to ensure synchronized colors.
 */

/**
 * Converts HSL values to a hex color string.
 * This ensures compatibility with MapLibre's style expressions.
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generates a deterministic color based on a string hash.
 * Uses HSL color space for good distribution, then converts to hex
 * for MapLibre compatibility.
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

  return hslToHex(hue, saturation, lightness);
}

/**
 * Predefined color palette for common intervention mixes.
 * Provides consistent colors for frequently-used combinations.
 * CM (Case Management) is the default intervention for all districts.
 */
export const PREDEFINED_INTERVENTION_COLORS: Record<string, string> = {
  "CM": "#9ca3af",           // Darker gray - base case management only (default state)
  "None": "#e5e7eb",         // Light gray - no interventions (edge case)
};

/**
 * Gets a color for an intervention mix, using predefined colors when available.
 * Falls back to deterministic color generation based on the mix label string.
 */
export function getColorForInterventionMix(mixLabel: string): string {
  return PREDEFINED_INTERVENTION_COLORS[mixLabel] ?? generateColorFromString(mixLabel);
}
