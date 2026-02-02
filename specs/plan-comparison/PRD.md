# Plan Comparison

## Overview

Introduce a comparison feature that allows users to compare the currently edited plan with all available predefined plans. This enables users to visually assess differences in intervention coverage between their working plan and reference plans.

---

## Feature Description

A toggleable sidebar on the right side of the main plan editor displays all available plans (BAU and NSP 2026-30) as miniature map views. The main editor always works with an editable copy of a plan, and the sidebar indicates when the current plan has been modified from its original state.

---

## Detailed Requirements

### Toggle Button

| Property | Value |
|----------|-------|
| Label | "Compare..." |
| Position | Right of the "Export plan" button |
| Behavior | Toggles the comparison sidebar visibility |
| Active state | Visually indicate when comparison sidebar is open |

### Comparison Sidebar

| Property | Value |
|----------|-------|
| Position | Right side of the main plan editor |
| Width | Fixed width (e.g., 320px) |
| Header title | "Compare with" |
| Behavior | Pushes or overlays main content when opened |

### Sidebar Structure

| Section | Position | Description |
|---------|----------|-------------|
| Header | Top | Title "Compare with" |
| Plan list | Middle (scrollable) | List of all available plan cards |

### Plan Comparison Card

Each plan is displayed as a card containing:

| Element | Description |
|---------|-------------|
| Title | Plan name (e.g., "BAU", "NSP 2026-30") |
| Edited badge | Badge displayed next to title if the plan has unsaved changes (only for current plan) |
| Map | Miniature intervention map showing the plan's coverage |

#### Card Layout

```
┌─────────────────────────────────┐
│ Plan Name  [Edited]             │
├─────────────────────────────────┤
│                                 │
│      [Miniature Map]            │
│                                 │
└─────────────────────────────────┘
```

### Available Plans

The sidebar automatically displays all predefined plans:

| Plan | Description |
|------|-------------|
| BAU | Business As Usual baseline plan |
| NSP 2026-30 | National Strategic Plan 2026-2030 |

---

## Edited State Detection

### Editable Copy Behavior

- When a user loads a plan in the main editor, they work on an **editable copy**
- The original plan definition remains unchanged
- Changes to rules, interventions, or coverage are tracked

### "Edited" Badge

| Property | Value |
|----------|-------|
| Label | "Edited" |
| Display condition | Shown when the current plan has modifications from its original state |
| Position | Next to the plan title in the comparison card |
| Styling | Small badge/pill (e.g., muted background, subtle text) |

### Change Detection

The "Edited" badge appears when any of the following differ from the original plan:

- Rules added, removed, or reordered
- Rule criteria modified
- Interventions added or removed from a rule
- Coverage percentages changed

---

## Interaction Details

### Opening the Comparison Sidebar

1. User clicks "Compare..." button
2. Sidebar slides in from the right
3. Button changes to active state
4. All available plans are displayed immediately

### Closing the Comparison Sidebar

1. User clicks "Compare..." button again
2. Sidebar slides out to the right
3. Button returns to inactive state

### Viewing Plan Changes

1. User makes changes to the current plan in the main editor
2. If the current plan matches one of the displayed plans, its card shows the "Edited" badge
3. The miniature map in the comparison sidebar reflects the original (unedited) plan
4. User can visually compare their changes in the main editor against the original in the sidebar

---

## Miniature Map Specifications

The miniature maps should display:

| Feature | Description |
|---------|-------------|
| Geographic boundaries | Same district boundaries as main map |
| Intervention colors | Same color coding as main map |
| Interactivity | Non-interactive (static display only) |
| Aspect ratio | Maintain same aspect ratio as main map |
| Size | Fit within card width (~280px) |

### Map Rendering

- Use the same map rendering logic as the main intervention map
- Apply the **original** plan's rules to determine district colors (not the edited version)
- Simplified view (no hover states, no tooltips, no legend)

---

## State Management

### Comparison State

| Property | Type | Description |
|----------|------|-------------|
| isOpen | boolean | Whether sidebar is visible |

### Edit Detection State

| Property | Type | Description |
|----------|------|-------------|
| originalPlan | PlanDefinition | The original plan loaded from predefined plans |
| currentPlan | PlanDefinition | The working copy with user modifications |
| isEdited | boolean | Computed: whether currentPlan differs from originalPlan |

---

## Visual Design

### Sidebar Styling

- Background: Subtle contrast from main content area
- Border: Left border to separate from main content
- Shadow: Optional subtle shadow for depth

### Card Styling

- Background: White/card background color
- Border: Subtle border around each card
- Spacing: Consistent padding and margin between cards

### Edited Badge Styling

- Background: Muted/secondary color (e.g., light gray or amber)
- Text: Small, readable label
- Border radius: Rounded pill shape
- Position: Inline with plan title, right-aligned or after title

---

## Technical Notes

### Component Structure

The comparison sidebar should be implemented as a **separate component** from the intervention map, not nested within it.

```
src/
├── components/
│   ├── intervention-map/
│   │   └── ...                        # Existing intervention map components
│   └── comparison-sidebar/
│       ├── comparison-sidebar.tsx     # Main sidebar container
│       ├── plan-comparison-card.tsx   # Individual plan card
│       └── miniature-map.tsx          # Simplified map view
```

### Architectural Notes

- The comparison sidebar is a **sibling component** to the intervention map, not a child
- Both components share access to plan data through context or props
- The sidebar receives the list of predefined plans and the current plan's edit state
- This separation allows for independent rendering and easier testing

### Integration Points

- Toggle button added to existing plan editor header/toolbar
- Sidebar and intervention map are siblings within the page layout
- Reuses intervention calculation logic from main map
- Reuses plan data from `predefined-plans.ts`
- Edit detection compares current rules state against original plan definition

### Map Rendering Considerations

- Consider using a separate, lighter-weight map instance for miniatures
- May need to memoize map rendering to prevent performance issues with multiple maps
- Maps always show original plan state, not edited state

---

## Non-Requirements

The following are explicitly **not** part of this feature:

- Adding or removing plans from the comparison (all plans always shown)
- Detailed side-by-side metric comparison (e.g., budget differences, coverage percentages)
- Difference highlighting (showing which districts changed between plans)
- Comparison export or sharing
- More than visual map comparison (no tabular data comparison)
- Comparison with historical versions of the same plan
- Synchronized interactions between miniature maps and main map
- Zooming or panning on miniature maps
- Showing the edited version in the sidebar (sidebar always shows original)

---

## Acceptance Criteria

### Toggle Button

1. "Compare..." button appears to the right of the "Export plan" button
2. Clicking the button opens the comparison sidebar
3. Clicking the button again closes the sidebar
4. Button shows active state when sidebar is open

### Comparison Sidebar

5. Sidebar appears on the right side of the main editor
6. Sidebar header displays "Compare with"
7. Sidebar displays all available plans (BAU, NSP 2026-30)
8. Plans are displayed automatically without user action

### Plan Cards

9. Each card displays the plan name as title
10. Each card displays a miniature map of the plan's interventions
11. Cards show the original plan state (not edited)

### Edited Badge

12. "Edited" badge appears next to plan title when current plan has modifications
13. Badge is not shown when plan matches original state
14. Badge updates in real-time as user makes changes

### Map Display

15. Miniature maps show correct district boundaries
16. Miniature maps use correct intervention colors
17. Miniature maps are non-interactive (no hover, no click)
18. Miniature maps reflect original plan definitions

### Architecture

19. Comparison sidebar is implemented as a separate component from intervention map
20. Sidebar and intervention map are sibling components in the layout

---

## Implementation Phases

### Phase 1: Sidebar Infrastructure

- Create comparison sidebar component (separate from intervention map)
- Implement toggle button in plan editor toolbar
- Set up sidebar open/close state management
- Integrate sidebar as sibling to intervention map in page layout

### Phase 2: Plan Cards

- Create plan comparison card component
- Display all predefined plans automatically
- Style card layout with placeholder for map

### Phase 3: Edit Detection

- Implement original plan vs current plan comparison logic
- Add "Edited" badge to card component
- Connect badge visibility to edit state

### Phase 4: Miniature Maps

- Create miniature map component
- Reuse intervention calculation logic
- Optimize rendering for multiple map instances
- Connect maps to original plan definitions

### Phase 5: Polish & Integration

- Refine animations and transitions
- Ensure responsive behavior
- Performance optimization
