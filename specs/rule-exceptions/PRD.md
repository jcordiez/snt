# Rule Exceptions & Collapsible Sections

## Overview

Enhance the rule edit dialog with an **Exceptions** feature that allows users to exclude specific districts from a rule's selection criteria. Additionally, make all major sections of the dialog collapsible for improved usability.

---

## Feature Description

### Exceptions Section

A new section positioned below "Selection Criteria" that displays a list of districts excluded from the rule. Users can:

1. **Add exceptions** via a button that opens a popover listing districts currently included by the rule's criteria
2. **Remove exceptions** by clicking a remove icon that appears on hover next to each exception

### Collapsible Sections

All major sections of the Edit Rule dialog become collapsible:

- Selection Criteria (collapsible)
- Exceptions (collapsible)
- Assign Interventions (collapsible)

---

## Detailed Requirements

### Exceptions Section

| Element | Description |
|---------|-------------|
| Section header | "Exceptions" with collapse toggle |
| Exception list | Vertical list of excluded district names |
| Add button | "Add Exception" button below the list |
| Empty state | Message when no exceptions: "No exceptions. All matching districts will be included." |

#### Adding an Exception

| Step | Behavior |
|------|----------|
| 1. Click "Add Exception" | Opens a popover anchored to the button |
| 2. Popover content | Scrollable list of district names currently included by the rule criteria |
| 3. Select district | Clicking a district adds it to the exceptions list and closes the popover |
| 4. Search (optional) | Text input at top of popover to filter the district list |

**Popover specifications:**

- Max height: 300px with overflow scroll
- Width: 280px minimum
- Empty state: "No districts match the current criteria" (when criteria returns 0 districts)
- Districts already in exceptions list should not appear in the popover

#### Removing an Exception

| Interaction | Behavior |
|-------------|----------|
| Hover over exception | Remove icon (X) appears to the right of the district name |
| Click remove icon | District is removed from exceptions and returns to the included pool |
| Keyboard | Focus exception row, press Delete or Backspace to remove |

#### Exception List Item Layout

```
┌─────────────────────────────────────────┐
│ [District Name]                    [X]  │  ← X visible on hover
└─────────────────────────────────────────┘
```

### Collapsible Sections

| Section | Default State | Collapse Behavior |
|---------|---------------|-------------------|
| Selection Criteria | Expanded | Click header to toggle |
| Exceptions | Expanded | Click header to toggle |
| Assign Interventions | Expanded | Click header to toggle |

**Section header layout:**

```
┌─────────────────────────────────────────┐
│ [▼] Selection Criteria                  │  ← Chevron + title, clickable
├─────────────────────────────────────────┤
│ (section content when expanded)         │
└─────────────────────────────────────────┘
```

- Chevron icon rotates 90° when collapsed (points right)
- Smooth height animation on expand/collapse (150-200ms)
- Section content hidden when collapsed
- Collapsed state is not persisted between modal opens

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
  interventionsByCategory: Map<number, number>;
  isAllDistricts?: boolean;
  excludedDistrictIds?: string[];  // NEW: Array of district IDs to exclude
}
```

### Exception Application Logic

When applying a rule to districts:

1. Evaluate selection criteria to get matching district IDs
2. Remove any IDs present in `excludedDistrictIds`
3. Apply interventions to remaining districts

---

## UI Components

### New Components

| Component | Purpose |
|-----------|---------|
| `CollapsibleSection` | Reusable wrapper for collapsible content with animated toggle |
| `ExceptionList` | Displays list of excluded districts with remove functionality |
| `AddExceptionPopover` | Popover with searchable district list for adding exceptions |

### Component Hierarchy

```
RuleEditModal
├── Rule Name (Input + Color picker)
├── CollapsibleSection: "Selection Criteria"
│   └── CriterionRow[] + Add Criterion button
├── CollapsibleSection: "Exceptions"
│   ├── ExceptionList
│   │   └── ExceptionItem[] (district name + remove icon)
│   └── AddExceptionPopover (triggered by Add Exception button)
└── CollapsibleSection: "Assign Interventions"
    └── RadioGroup[] (intervention categories)
```

---

## Interaction Details

### Add Exception Flow

1. User clicks "Add Exception" button
2. System evaluates current criteria to determine matching districts
3. Popover opens showing matching districts (minus already-excluded ones)
4. User can optionally type in search box to filter the list
5. User clicks a district name
6. District is added to `excludedDistrictIds`
7. Popover closes
8. Exception appears in the Exceptions list

### Exception Validation

- If criteria changes and an excepted district no longer matches the criteria, the exception remains but has no effect (district wasn't going to be included anyway)
- Exceptions persist when editing criteria
- Exceptions are saved with the rule and restored when editing

---

## Visual Design

### Exception Item States

| State | Appearance |
|-------|------------|
| Default | District name, muted text color |
| Hover | Background highlight, remove icon (X) visible |
| Focus | Focus ring for accessibility |

### Collapsible Section States

| State | Appearance |
|-------|------------|
| Expanded | Chevron pointing down, content visible |
| Collapsed | Chevron pointing right, content hidden |
| Hover (header) | Subtle background highlight |

### Colors and Spacing

- Exception list: Use existing `muted-foreground` for text
- Remove icon: `destructive` color on hover
- Section headers: `font-medium`, `text-sm`
- Section padding: Consistent with existing modal sections

---

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Collapsible sections | Use proper ARIA attributes (`aria-expanded`, `aria-controls`) |
| Exception list | `role="list"` with `role="listitem"` for items |
| Remove button | `aria-label="Remove [District Name] from exceptions"` |
| Keyboard navigation | Tab through items, Enter/Space to remove, Escape to close popover |
| Focus management | Return focus to Add button after popover closes |

---

## Non-Requirements

The following are explicitly **not** part of this feature:

- Bulk add/remove of exceptions
- Import exceptions from file/clipboard
- Exception templates or presets
- Drag-and-drop reordering of exceptions
- Exception groups or categories
- Visual highlighting of excepted districts on the map (future consideration)
- Persisting collapsed section state between modal opens

---

## Technical Notes

- Use shadcn/ui `Collapsible` component for sections
- Use shadcn/ui `Popover` for the add exception flow
- Consider using `@radix-ui/react-collapsible` primitives if needed
- Exception list should be virtualized if expecting >100 exceptions (unlikely for MVP)
- District list in popover should handle large datasets (1000+ districts)

---

## Acceptance Criteria

1. Edit Rule dialog displays three collapsible sections: Selection Criteria, Exceptions, Assign Interventions
2. Clicking a section header toggles its collapsed/expanded state
3. Collapsed sections show only the header with a right-pointing chevron
4. Expanded sections show a down-pointing chevron and full content
5. Exceptions section displays below Selection Criteria
6. Empty exceptions state shows appropriate message
7. "Add Exception" button opens a popover with matching districts
8. Popover includes a search input to filter districts
9. Clicking a district in the popover adds it to exceptions
10. Popover closes after selecting a district
11. Exceptions list shows all excluded districts
12. Hovering an exception reveals a remove (X) icon
13. Clicking the remove icon removes the district from exceptions
14. Exceptions are saved with the rule
15. Editing a rule restores previously saved exceptions
16. Rules correctly exclude excepted districts when applied
17. The map view is correctly updated upon exceptions defintiion
18. The list view is correctly updated upon exceptions defintiion
19. All interactions are keyboard accessible
20. Proper ARIA attributes are used for accessibility

---

## Implementation Phases

### Phase 1: Collapsible Sections

- Add `CollapsibleSection` component
- Wrap existing sections in collapsible wrappers
- Implement expand/collapse animation

### Phase 2: Exceptions Data Model

- Update `SavedRule` type with `excludedDistrictIds`
- Update rule saving/loading logic
- Update rule application logic to respect exceptions

### Phase 3: Exceptions UI

- Add `ExceptionList` component
- Add `AddExceptionPopover` component
- Wire up state management in modal
- Add search functionality to popover

### Phase 4: Polish & Accessibility

- Add keyboard navigation
- Add ARIA attributes
- Test with screen readers
- Handle edge cases (empty states, large lists)
