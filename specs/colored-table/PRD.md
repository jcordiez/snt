# Colored Table Rows in List View

## Overview

Add visual feedback to the List View by coloring each row's background with the color of the rule applied to that district. This creates visual consistency between the map view and list view, allowing users to immediately identify which intervention rule applies to each district.

## Feature Description

In the List View component, each table row displays a background color corresponding to the intervention rule applied to that district. The background uses 30% opacity at rest to ensure text readability while maintaining clear visual association with rule colors used throughout the application.

---

## Detailed Requirements

### Rule Matching

- **Multiple rule matches**: When a district matches multiple rules, use the **last matching rule** from the rules list (rules are evaluated in order, last match wins)
- **No matching rule**: Districts with no matching rule display with a plain white/unstyled background

### Opacity States

| State | Opacity | Transition Duration |
|-------|---------|---------------------|
| Default | 30% | — |
| Hover | 45% | 100ms |
| Selected | 50% | 100ms |
| Hover + Selected | 50% (no additional effect) | — |

### Color Application

- **Scope**: Color applies to the **entire row** uniformly (all columns)
- **Implementation**: Use **inline styles** for background-color
- **Zebra striping**: Remove any existing alternating row colors when rule colors are active

### Transitions & Animations

- **Rule color changes**: Smooth transition (200-300ms) when a rule's color is modified
- **Hover/unhover**: Fast 100ms transition for responsive feel
- **Rule deletion**: Rows animate (fade out) the color smoothly when their matching rule is deleted
- **Rule assignment changes**: Smooth transition when a district's matching rule changes

### Hover & Selection Behavior

- **Hover effect**: Entire row darkens uniformly when hovering anywhere on the row
- **Selection persistence**: Selected rows maintain the darkened (50%) state until deselected
- **Combined state**: Hovering an already-selected row produces no additional visual effect

### Header & Layout

- **Header row**: Remains unchanged (no special styling related to this feature)
- **Row click behavior**: No special rule-related action on click (existing behavior preserved)

---

## Non-Requirements

The following are explicitly **not** part of this feature:

- No colorblind accessibility patterns or icons (rely on legend/column data)
- No toggle to disable colored rows (always active)
- No minimum contrast/visibility adjustment for light colors
- No filter/sort context feedback (e.g., rule counts, legend highlights)
- No cell-level hover states (row-level only)

---

## Technical Notes

- Colors are defined in rule configuration and should be accessed via existing rule data structures
- The 30%/45%/50% opacity can be achieved using `rgba()` or CSS `opacity` on a pseudo-element
- Inline styles are acceptable for this feature given the dynamic nature of rule colors

---

## Acceptance Criteria

1. Rows in List View display background colors matching their applied rule at 30% opacity
2. The last matching rule determines the color when multiple rules match
3. Rows with no matching rule have no background color (white/default)
4. Hovering a row darkens it to 45% opacity with 100ms transition
5. Selecting a row darkens it to 50% opacity, persisting until deselected
6. Hovering a selected row produces no additional visual change
7. Color changes (rule edits, deletions, reassignments) animate smoothly (200-300ms)
8. All text and content remains clearly readable at all opacity states
9. Existing zebra striping is removed when this feature is active
10. Table header row styling is unchanged
