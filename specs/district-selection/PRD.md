# District Selection on Map

## Overview

Enable users to select districts directly on the map by clicking. Support multi-selection via Cmd+click. Display a selection widget in the top-left corner with quick actions to manage rule exceptions for selected districts.

---

## Feature Description

### District Selection

Users can click on districts on the map to select them:

1. **Single click** - Selects the clicked district, clearing any previous selection
2. **Cms+click** - Adds/removes the clicked district to/from the current selection (toggle behavior)

### Selection Widget

A floating widget appears in the top-left corner of the map when one or more districts are selected:

- Displays count of selected districts: "X districts selected"
- Provides two action buttons:
  - **"Set as exceptions"** - Adds selected districts as exceptions to their associated rules
  - **"Remove from exceptions"** - Removes selected districts from any exception lists they belong to

---

## Detailed Requirements

### District Click Behavior

| Modifier | Behavior |
|----------|----------|
| No modifier (click) | Clear existing selection, select clicked district |
| Shift held (Shift+click) | Toggle clicked district in selection set (add if not selected, remove if selected) |

#### Visual Feedback

| State | Appearance |
|-------|------------|
| Unselected | Normal fill color (intervention-based or rule-based) |
| Selected | Blue border highlight (3px, #3b82f6) around the district |
| Hover (unselected) | Cursor changes to pointer (existing behavior) |
| Hover (selected) | Cursor changes to pointer |

**Note:** The existing `HIGHLIGHT_BORDER_LAYER_ID` layer can be repurposed or extended to show selection state.

### Selection Widget

#### Visibility

| Condition | Widget State |
|-----------|--------------|
| No districts selected | Hidden (not rendered) |
| 1+ districts selected | Visible |

#### Layout

```
┌─────────────────────────────────────────────────┐
│  X district(s) selected                         │
│  [Set as exceptions]  [Remove from exceptions]  │
└─────────────────────────────────────────────────┘
```

#### Widget Specifications

| Property | Value |
|----------|-------|
| Position | Top-left corner of map, with padding (16px from edges) |
| Background | White with slight shadow (card-like appearance) |
| Border radius | 8px |
| Padding | 12px 16px |
| Z-index | Above map layers, below modals |
| Max width | 320px |

#### Button Behaviors

##### "Set as exceptions" Button

When clicked:

1. For each selected district, determine which rule(s) currently include it via their selection criteria
2. Add the district ID to the `excludedDistrictIds` array of those rules
3. Clear the selection after action completes
4. Show a brief toast/notification confirming the action: "X district(s) added to exceptions"

##### "Remove from exceptions" Button

When clicked:

1. For each selected district, find all rules where it appears in `excludedDistrictIds`
2. Remove the district ID from those exception lists
3. Clear the selection after action completes
4. Show a brief toast/notification confirming the action: "X district(s) removed from exceptions"

---

## Data Model

### Selection State

```typescript
// New state to be managed (likely in InterventionMap or a new context)
interface DistrictSelectionState {
  selectedDistrictIds: Set<string>;
}
```

### Integration with Existing Rule Exceptions

The feature leverages the existing `excludedDistrictIds` field in `SavedRule`:

```typescript
export interface SavedRule {
  id: string;
  title: string;
  color: string;
  criteria: RuleCriterion[];
  interventionsByCategory: Map<number, number>;
  isAllDistricts?: boolean;
  excludedDistrictIds?: string[];  // Used by this feature
}
```

---

## UI Components

### New Components

| Component | Purpose |
|-----------|---------|
| `SelectionWidget` | Floating widget showing selection count and action buttons |
| `useDistrictSelection` | Custom hook managing selection state and click handlers |

### Component Hierarchy

```
InterventionMap
├── Map (existing)
│   └── DistrictLayer (enhanced with click handlers)
├── SelectionWidget (NEW - conditionally rendered)
│   ├── Selection count text
│   ├── "Set as exceptions" button
│   └── "Remove from exceptions" button
└── ... existing components
```

---

## Interaction Details

### Selection Flow

1. User clicks on a district on the map
2. System checks if Shift key is held
3. If Shift held:
   - If district already selected → remove from selection
   - If district not selected → add to selection
4. If Shift not held:
   - Clear all existing selections
   - Add clicked district to selection
5. Update highlight layer to show selected districts
6. If selection is non-empty, show SelectionWidget
7. If selection becomes empty, hide SelectionWidget

### "Set as exceptions" Flow

1. User clicks "Set as exceptions" button
2. System iterates through all saved rules
3. For each rule:
   - Evaluate selection criteria to get matching district IDs
   - Check if any selected districts are in the matching set
   - If yes, add those district IDs to `excludedDistrictIds`
4. Save updated rules
5. Clear selection
6. Update map visualization (districts may change color if now excluded from rules)
7. Show confirmation toast

### "Remove from exceptions" Flow

1. User clicks "Remove from exceptions" button
2. System iterates through all saved rules
3. For each rule:
   - Check if any selected districts are in `excludedDistrictIds`
   - If yes, remove those district IDs from the array
4. Save updated rules
5. Clear selection
6. Update map visualization
7. Show confirmation toast

---

## Visual Design

### Selection Widget States

| State | Appearance |
|-------|------------|
| Default | White background, shadow-sm, rounded corners |
| Button hover | Standard button hover state |
| Button disabled | Reduced opacity (when action not applicable) |

### Selection Highlight

| Property | Value |
|----------|-------|
| Border color | #3b82f6 (blue-500) |
| Border width | 3px |
| Border style | Solid |

### Colors and Spacing

- Widget background: `bg-white` / `bg-card`
- Widget shadow: `shadow-md`
- Text: `text-sm`, `text-foreground`
- Buttons: Use existing button component styles
- Button spacing: 8px gap between buttons

---

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Selection feedback | Announce selection changes to screen readers via aria-live region |
| Widget | Proper heading structure, buttons have descriptive labels |
| Keyboard support | Tab to widget buttons, Enter/Space to activate |
| Focus management | Focus moves to widget when selection changes (optional enhancement) |
| Click alternatives | Consider adding keyboard selection in future iteration |

---

## Edge Cases

### No Rules Defined

- "Set as exceptions" button should be disabled with tooltip: "No rules defined"
- "Remove from exceptions" button should be disabled with tooltip: "No rules defined"

### District Not Matched by Any Rule

- "Set as exceptions" has no effect for districts not matched by any rule criteria
- Should still clear selection and show toast: "0 districts added to exceptions (no matching rules)"

### District Already an Exception

- "Set as exceptions" has no additional effect (district already excluded)
- Count in toast reflects only newly added exceptions

### District Not in Any Exception List

- "Remove from exceptions" has no effect
- Should still clear selection and show toast: "0 districts removed from exceptions"

### Clicking Inactive Districts

- Inactive districts (outside selected province when a province is selected) should not be selectable
- Click on inactive district should have no effect

---

## Non-Requirements

The following are explicitly **not** part of this feature:

- Drag-to-select (lasso selection) - future consideration
- Keyboard-only district selection on map
- Persisting selection across page refreshes
- Selection history/undo
- Exporting selected districts list
- Selecting districts across multiple provinces simultaneously (when province filter is active)
- Custom selection highlight colors
- Selection grouping or naming

---

## Technical Notes

- Extend `DistrictLayer` component to handle click events
- Use MapLibre's `queryRenderedFeatures` to identify clicked district
- Selection state should be lifted to `InterventionMap` component or managed via context
- Reuse existing highlight layer (`HIGHLIGHT_BORDER_LAYER_ID`) for selection visualization
- Toast notifications can use existing toast system if available, or add a simple one
- Ensure click handlers don't interfere with existing map interactions (pan, zoom)

---

## Acceptance Criteria

1. Clicking a district on the map selects it (highlighted with blue border)
2. Clicking another district without Shift clears previous selection and selects new district
3. Shift+clicking a district adds it to existing selection
4. Shift+clicking an already-selected district removes it from selection
5. Selection widget appears when 1+ districts are selected
6. Selection widget is hidden when no districts are selected
7. Selection widget displays correct count (e.g., "3 districts selected")
8. Selection widget uses singular form for single selection ("1 district selected")
9. "Set as exceptions" button adds selected districts to their matching rules' exception lists
10. "Remove from exceptions" button removes selected districts from all rules' exception lists
11. Both buttons clear the selection after action completes
12. Toast notification confirms the action with count of affected districts
13. Map visualization updates correctly after exception changes
14. Inactive districts (outside selected province) cannot be selected
15. Buttons are disabled when no rules are defined
16. Widget is positioned in top-left corner with proper spacing
17. All interactions are accessible (proper ARIA attributes, keyboard support for buttons)

---

## Implementation Phases

### Phase 1: Selection State & Click Handling

- Add selection state management to `InterventionMap`
- Implement click handler in `DistrictLayer`
- Handle Shift modifier for multi-select
- Update highlight layer to show selected districts

### Phase 2: Selection Widget UI

- Create `SelectionWidget` component
- Position widget in top-left corner
- Display selection count with proper pluralization
- Add button placeholders

### Phase 3: Exception Actions

- Implement "Set as exceptions" logic
- Implement "Remove from exceptions" logic
- Integrate with existing rule management hooks
- Add toast notifications

### Phase 4: Polish & Edge Cases

- Handle inactive district clicks
- Add disabled states for buttons when no rules exist
- Add accessibility attributes
- Test edge cases (no rules, already excepted, etc.)
