# Intervention Coverage Percentage

## Overview

Allow users to define a **coverage percentage** for each intervention they select in the rule editor. Coverage represents what proportion of the target population or area the intervention will reach.

---

## Feature Description

### Coverage Dropdown in Rule Editor

When an intervention is selected in the "Assign Interventions" section of the rule edit modal, a coverage dropdown appears to the left of the "Remove" button. Users can select a percentage value from 0% to 100% in increments of 10.

### Coverage Display in Rules List

The rule card displays coverage values next to each intervention name in a compact format: `"LSM (50%), R21 (20%), CM (70%)"`.

---

## Detailed Requirements

### Coverage Dropdown

| Element | Description |
|---------|-------------|
| Position | To the left of the existing "Remove" button |
| Visibility | Only visible when the intervention is selected |
| Values | 0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100% |
| Default value | 70% for all interventions |
| Width | Compact, approximately 80px |

#### Dropdown Appearance

```
┌─────────────────────────────────────────────────────────────────┐
│ ○ Standard Pyrethroid Campaign                                  │
                                   │
│                                          [70% ▼]    [Remove]    │
└─────────────────────────────────────────────────────────────────┘
```

When intervention is NOT selected:
```
┌─────────────────────────────────────────────────────────────────┐
│ ○ Standard Pyrethroid Campaign                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Coverage Values

| Value | Increment |
|-------|-----------|
| Minimum | 0% |
| Maximum | 100% |
| Step | 10 |
| Options | 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 |

### Default Coverage

- All interventions default to **70%** coverage when first selected
- Default interventions (CM, Standard Pyrethroid Campaign, Standard Pyrethroid Routine) also default to 70%
- Coverage is preserved when editing an existing rule

### Rules List Display

The `RuleCard` component displays interventions with their coverage values:

| Current Format | New Format |
|----------------|------------|
| `CM + LSM + R21` | `CM (70%) + LSM (50%) + R21 (20%)` |

#### Display Rules

- Always show coverage percentage in parentheses after intervention short name
- Use the same separator (`+`) between interventions
- Format: `{short_name} ({coverage}%)`

---

## Data Model Changes

### SavedRule Type Extension

```typescript
// In src/types/rule.ts
export interface SavedRule {
  id: string;
  title: string;
  color: string;
  criteria: RuleCriterion[];
  /** Maps categoryId -> interventionId for each assigned intervention */
  interventionsByCategory: Map<number, number>;
  /** Maps categoryId -> coverage percentage (0-100) for each intervention */
  coverageByCategory?: Map<number, number>;  // NEW
  /** When true, the rule applies to all districts regardless of criteria */
  isAllDistricts?: boolean;
  /** Array of district IDs to exclude from this rule's selection criteria */
  excludedDistrictIds?: string[];
}
```

### Default Coverage Constant

```typescript
// In src/components/intervention-map/rules-sidebar/rule-edit-modal.tsx
const DEFAULT_COVERAGE = 70;

const COVERAGE_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
```

### Migration for Existing Rules

- Rules without `coverageByCategory` should default to 70% for all selected interventions
- When loading an existing rule, initialize missing coverage values to 70%

---

## UI Components

### Modified Components

| Component | Changes |
|-----------|---------|
| `RuleEditModal` | Add coverage dropdown next to Remove button for selected interventions |
| `RuleCard` | Update `formatInterventionMix` to include coverage percentages |

### Component Updates

#### RuleEditModal - Intervention Row Layout

```
RadioGroup (intervention category)
├── RadioGroupItem + Label
│   ├── Intervention name
│   └── Description (optional)
└── Actions container (visible when selected)
    ├── Coverage Select dropdown   ← NEW
    └── Remove button (existing)
```

#### RuleCard - Intervention Display

The `formatInterventionMix` function should be updated to include coverage:

```typescript
function formatInterventionMix(
  interventionsByCategory: Map<number, number>,
  coverageByCategory: Map<number, number> | undefined,
  interventionCategories: InterventionCategory[]
): string {
  // ... lookup intervention short_name
  // ... get coverage, default to 70 if not set
  // ... format as "ShortName (XX%)"
}
```

---

## Interaction Details

### Selecting an Intervention

1. User clicks radio button to select an intervention
2. Coverage dropdown appears with 70% pre-selected
3. Remove button appears to the right of coverage dropdown

### Changing Coverage

1. User clicks coverage dropdown
2. Dropdown opens showing all percentage options (0-100 in increments of 10)
3. User selects a value
4. Dropdown closes and displays the new value
5. Coverage is stored in `coverageByCategory` map

### Removing an Intervention

1. User clicks "Remove" button
2. Intervention is deselected (radio unchecked)
3. Coverage value is removed from `coverageByCategory` map
4. Both dropdown and Remove button disappear

### Saving a Rule

1. User clicks "Create" or "Save" button
2. `interventionsByCategory` and `coverageByCategory` are saved together
3. Both maps share the same categoryId keys

---

## Visual Design

### Coverage Dropdown States

| State | Appearance |
|-------|------------|
| Default | Shows current value (e.g., "70%") with chevron |
| Hover | Subtle background highlight |
| Open | Dropdown menu with all options visible |
| Selected option | Checkmark or highlight on current value |

### Dropdown Styling

- Use existing shadcn/ui `Select` component for consistency
- Compact width to fit alongside Remove button
- Text alignment: right-aligned value with dropdown indicator
- Font size: Same as Remove button (`text-xs` or `text-sm`)

### Layout Spacing

```
[Radio] [Label text................................] [70% ▼] [Remove]
        [Description text (muted, smaller)]
```

- Gap between coverage dropdown and Remove button: 8px (`gap-2`)
- Coverage dropdown min-width: 70px
- Coverage dropdown max-width: 80px

---

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Dropdown | Use proper `Select` with `aria-label="Coverage percentage"` |
| Label | Associate coverage with intervention name for screen readers |
| Keyboard | Tab to focus dropdown, arrow keys to navigate options |
| Announce | Screen reader should announce "Coverage: 70 percent" |

---

## Non-Requirements

The following are explicitly **not** part of this feature:

- Custom coverage values (only 10% increments)
- Coverage validation or warnings (e.g., warning if total > 100%)
- Coverage templates or presets
- Bulk coverage editing
- Coverage displayed on map visualization
- Coverage calculations or aggregations
- Different default coverage per intervention type

---

## Technical Notes

- Reuse existing shadcn/ui `Select` component
- Consider extracting intervention row into a separate component if it becomes too complex
- Coverage map should be serialized/deserialized alongside interventions map in local storage
- Ensure backward compatibility with rules that don't have coverage data

---

## Acceptance Criteria

1. Coverage dropdown appears when an intervention is selected in the rule editor
2. Dropdown is positioned to the left of the Remove button
3. Dropdown shows values from 0% to 100% in increments of 10
4. Default coverage value is 70% for newly selected interventions
5. Coverage selection persists when saving the rule
6. Editing a rule restores previously saved coverage values
7. Rules without coverage data default to 70% for all interventions
8. Rule cards display coverage next to each intervention name
9. Format: `"InterventionName (XX%)"` with `+` separator
10. Removing an intervention also removes its coverage value
11. Coverage dropdown is keyboard accessible
12. Screen readers can access coverage information

---

## Implementation Phases

### Phase 1: Data Model

- Update `SavedRule` type with `coverageByCategory` map
- Add `DEFAULT_COVERAGE` constant (70)
- Add `COVERAGE_OPTIONS` array
- Update rule saving/loading logic to include coverage

### Phase 2: Rule Editor UI

- Add coverage `Select` dropdown in intervention row
- Position dropdown to the left of Remove button
- Initialize coverage to 70% when intervention is selected
- Remove coverage when intervention is deselected
- Wire up state management for `coverageByCategory`

### Phase 3: Rule Card Display

- Update `formatInterventionMix` function to include coverage
- Handle missing coverage data (default to 70%)
- Test display with various intervention combinations

### Phase 4: Polish

- Ensure proper tab order and keyboard navigation
- Add ARIA labels for accessibility
- Test with existing rules (backward compatibility)
- Verify local storage serialization/deserialization
