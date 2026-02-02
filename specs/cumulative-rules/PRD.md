# Cumulative Rules Mode

## Overview

Add a "cumulative mode" toggle to the rules sidebar that changes how interventions from multiple rules are applied to districts. When **off** (default/current behavior), rules are exclusive — the last matching rule wins and defines the complete intervention mix for a district. When **on**, rules are additive — each matching rule contributes its interventions, and a district that matches multiple rules receives all of their interventions combined.

## Current Behavior

Rules are evaluated in order. When multiple rules match a district, the last matching rule's intervention mix replaces any previous ones. Each rule defines the complete set of interventions for the districts it matches.

## Cumulative Mode Behavior

When cumulative mode is toggled on:

- Each rule defines the **presence** of specific interventions, not the complete mix.
- A district matching multiple rules receives the **union** of all matching rules' interventions.
- If two rules assign different interventions in the **same category**, the last matching rule's intervention for that category wins (per-category last-write-wins).
- If two rules assign different **coverage** values for the same category, the last matching rule's coverage wins.
- Rule ordering still matters for conflict resolution within a category, but interventions from non-overlapping categories are simply merged.

### Example

| Rule | Criteria | Intervention |
|------|----------|-------------|
| Rule 1 | Seasonality > 0.6 | LSM |
| Rule 2 | Prevalence > 150 | ITNs |

| District | Seasonality | Prevalence | Exclusive mode | Cumulative mode |
|----------|------------|------------|----------------|-----------------|
| A | 0.8 | 100 | LSM | LSM |
| B | 0.3 | 200 | ITNs | ITNs |
| C | 0.8 | 200 | ITNs (last rule wins) | LSM + ITNs |

## UI

- A `Switch` component placed to the **left of the magic wand** (Wand2 icon) button in the rules sidebar header.
- Tooltip or label: "Cumulative mode" (shown on hover).
- When toggled on, the switch is visually active. No other UI changes are needed — the map/list/budget views simply reflect the merged interventions.

## Technical Approach

### State

- Add a `isCumulativeMode: boolean` state to the plan page (alongside `savedRules`), defaulting to `false`.
- Pass it down to the rules sidebar and to all rule-evaluation logic.

### Rule Evaluation Changes

In `use-district-rules.ts` and related functions (`getLastMatchingRuleColor`, the intervention-map rendering logic):

- **Exclusive mode (current):** Last matching rule's `interventionsByCategory` map is used as-is.
- **Cumulative mode:** For each district, iterate all visible matching rules in order. Merge their `interventionsByCategory` maps (and `coverageByCategory`) using `Map` spread/merge — later rules overwrite earlier ones per category key, but categories from earlier rules that aren't present in later rules are preserved.

The merged result per district should be a single `interventionsByCategory` map representing the union of all matching rules.

### Color in Cumulative Mode

When a district matches multiple rules in cumulative mode, use the **last matching rule's color** for map display (same as current behavior). The color is cosmetic and does not affect the intervention logic.

### Affected Components

- `rules-sidebar.tsx` — Add Switch + prop for toggle state.
- `intervention-map.tsx` / plan page — Hold `isCumulativeMode` state, pass to children.
- `use-district-rules.ts` — Add cumulative merge logic for `interventionsByCategory`.
- `list-view.tsx` / `intervention-table.tsx` — Display merged interventions per district.
- `budget-view.tsx` — Compute costs based on merged intervention sets.

## Out of Scope

- Per-rule toggle (cumulative applies globally to all rules).
- Persisting cumulative mode to predefined plans (can be added later).
- Visual indicator on the map for multi-rule districts (e.g., striped fills).
