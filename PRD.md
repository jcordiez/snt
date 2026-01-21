# PRD: Rules Sidebar

## Overview

Add a persistent sidebar on the right side of the map that displays a list of intervention rules. Each rule defines criteria for selecting districts and the interventions to apply to them.

## User Stories

1. As a user, I want to see all my rules in a sidebar so I can understand what interventions are applied where
2. As a user, I want to create new rules to define district selection criteria and interventions
3. As a user, I want to edit existing rules to modify criteria or interventions
4. As a user, I want to delete rules that are no longer needed

## UI Design

### Sidebar Layout

```
┌──────────────────────────────────────────┐
│  Rules                              [+]  │  <- Header with Add button
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Rule 1 Title              [Edit]  │  │
│  │                                    │  │
│  │ Districts where                    │  │
│  │ • seasonality < 0.6                │  │
│  │ • Incidence rates >= 300 per 1000  │  │
│  │                                    │  │
│  │ shall receive                      │  │
│  │ **IG2 + SMC + PMC + R21 + CM**     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Rule 2 Title              [Edit]  │  │
│  │ ...                                │  │
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

### Sidebar Specifications

- **Position**: Right side of the map, always visible
- **Width**: 320px (fixed)
- **Header**: "Rules" text with "+" button to add new rule
- **Content**: Scrollable list of rule cards
- **Styling**: White background, subtle border-left, shadow

### Rule Card

Each rule card displays:
1. **Title** (top-left, bold)
2. **Edit button** (top-right)
3. **Criteria description**:
   - "Districts where" followed by bulleted list of criteria
   - Each criterion formatted as: `{indicator name} {operator} {value} {unit}`
4. **Interventions**:
   - "shall receive" followed by intervention mix label in bold

### Edit Rule Modal

Opens when clicking Edit or Add button:

```
┌─────────────────────────────────────────────────┐
│  Create Rule / Edit Rule                    [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Title                                          │
│  ┌───────────────────────────────────────────┐  │
│  │ Rule title...                             │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  Criteria                                       │
│  Districts where all of the following apply:    │
│                                                 │
│  ┌─────────────┬────┬────────┐                  │
│  │ Seasonality │ <  │  0.6   │  [x]            │  <- Delete on hover
│  └─────────────┴────┴────────┘                  │
│  ┌─────────────┬────┬────────┐                  │
│  │ Incidence   │ >= │  300   │  [x]            │
│  └─────────────┴────┴────────┘                  │
│                                                 │
│  [+ Add criterion]                              │
│                                                 │
│  Interventions                                  │
│  Select one intervention per category:          │
│                                                 │
│  Vector Control                                 │
│    ○ IG2 Indoor Residual Spraying    [Remove]  │
│    ● Dual AI LLIN Distribution                  │
│    ○ PBO LLIN Distribution                      │
│                                                 │
│  Chemoprevention                                │
│    ● SMC Seasonal Malaria Chemo...   [Remove]  │
│    ○ IPTp Intermittent Preventive...            │
│                                                 │
│  [+ Add category]  (if any unselected)          │
│                                                 │
├─────────────────────────────────────────────────┤
│                      [Cancel]  [Create/Save]    │
└─────────────────────────────────────────────────┘
```

### Modal Specifications

- **Size**: 500px width, max-height 80vh with scrollable content
- **Title input**: Text field for rule name
- **Criteria section**:
  - Each criterion row: Indicator dropdown | Operator dropdown | Value input | Delete button (visible on hover)
  - Indicator dropdown: Grouped by category (same as existing rule builder)
  - Operators: `<`, `<=`, `=`, `>=`, `>`
  - Value input: Number field
  - "Add criterion" button below criteria list
- **Interventions section**:
  - Radio button groups per category (reuse existing pattern from DistrictSelectionStep)
  - "Remove" button next to selected intervention (already implemented)
- **Footer buttons**:
  - Cancel: Close modal without saving
  - Create/Save: Save rule and close modal (disabled if no criteria or interventions selected)

## Data Model

### Rule Interface

```typescript
interface SavedRule {
  id: string;
  title: string;
  criteria: RuleCriterion[];
  interventionsByCategory: Map<number, number>; // categoryId -> interventionId
  createdAt: string;
  updatedAt: string;
}

interface RuleCriterion {
  id: string;
  metricTypeId: number;
  operator: RuleOperator; // '<' | '<=' | '=' | '>=' | '>'
  value: number;
}
```

### State Management

Rules state will be managed in `page.tsx`:
```typescript
const [savedRules, setSavedRules] = useState<SavedRule[]>([]);
```

## Component Structure

```
src/components/intervention-map/
├── rules-sidebar/
│   ├── index.ts                    # Exports
│   ├── rules-sidebar.tsx           # Main sidebar component
│   ├── rule-card.tsx               # Individual rule display card
│   └── rule-edit-modal.tsx         # Create/Edit rule modal
```

## Behavior

### Adding a Rule
1. User clicks "+" button in sidebar header
2. Modal opens with empty form
3. User enters title, adds criteria, selects interventions
4. User clicks "Create"
5. Rule is added to list, modal closes
6. Districts matching the rule criteria are updated with the selected interventions

### Editing a Rule
1. User clicks "Edit" on a rule card
2. Modal opens pre-populated with rule data
3. User modifies title, criteria, or interventions
4. User clicks "Save"
5. Rule is updated, modal closes
6. Districts are re-evaluated and updated

### Deleting a Rule
1. User clicks "Edit" on a rule card
2. Modal shows "Delete" button (destructive style)
3. User clicks "Delete"
4. Confirmation dialog appears
5. On confirm, rule is removed
6. Districts that were affected may revert (TBD: exact behavior)

## Page Layout Changes

Update main layout from:
```
┌─────────────────────────────────────┐
│  Header                             │
├─────────────────────────────────────┤
│                                     │
│            Map (full width)         │
│                                     │
└─────────────────────────────────────┘
```

To:
```
┌─────────────────────────────────────────────────┐
│  Header                                         │
├───────────────────────────────────┬─────────────┤
│                                   │             │
│        Map (flex-1)               │  Rules      │
│                                   │  Sidebar    │
│                                   │  (320px)    │
│                                   │             │
└───────────────────────────────────┴─────────────┘
```

## Files to Modify/Create

### New Files
- `src/components/intervention-map/rules-sidebar/rules-sidebar.tsx`
- `src/components/intervention-map/rules-sidebar/rule-card.tsx`
- `src/components/intervention-map/rules-sidebar/rule-edit-modal.tsx`
- `src/components/intervention-map/rules-sidebar/index.ts`
- `src/types/rule.ts` (or extend `intervention.ts`)

### Modified Files
- `src/app/page.tsx` - Add sidebar to layout, manage rules state
- `src/components/intervention-map/index.ts` - Export new components

## Reusable Components

Leverage existing implementations:
- **Metric type dropdown**: From `RuleRow` component
- **Operator dropdown**: From `RuleRow` component
- **Intervention radio groups with Remove**: From `DistrictSelectionStep` component
- **Modal pattern**: From `Sheet` component (or use Dialog for true modal)

## Out of Scope

- Rule ordering/priority
- Rule enable/disable toggle
- Rule duplication
- Undo/redo for rule changes
- Persistence (rules are session-only for now)
- Conflict resolution when multiple rules match same district

## Implementation Phases

### Phase 1: Sidebar Shell
- Create sidebar component structure
- Update page layout to include sidebar
- Add header with "Rules" title and "+" button

### Phase 2: Rule Display
- Implement rule card component
- Display criteria as formatted description
- Display intervention mix label
- Add Edit button (non-functional)

### Phase 3: Rule Modal
- Implement rule edit modal component
- Criteria editor (add/remove/edit criteria rows)
- Intervention selector (radio groups by category)
- Cancel/Save buttons

### Phase 4: State Management
- Wire up modal to create/edit rules
- Store rules in page state
- Generate display descriptions from rule data

### Phase 5: District Updates
- On rule save, evaluate criteria against districts
- Apply interventions to matching districts
- Handle rule deletion (revert or keep changes TBD)
