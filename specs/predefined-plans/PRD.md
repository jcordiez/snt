# Predefined Plans and Routing

## Overview

Implement predefined intervention plans (BAU and NSP 2026-30) with proper routing structure. The application will have a welcome screen at the root route, plan viewing/editing at `/plan/PLAN_ID`, and new plan creation at `/plan`.

---

## Feature Description

### Predefined Plans

Two predefined plans are available in the application:

1. **BAU** (Business As Usual) - A baseline plan with minimal intervention targeting
2. **NSP 2026-30** - National Strategic Plan for 2026-2030 with comprehensive malaria intervention coverage

### Routing Structure

| Route | Content |
|-------|---------|
| `/` | Welcome screen |
| `/plan` | New plan editor with default rule only |
| `/plan/[planId]` | View/edit specific plan (map/list/budget views) |

---

## Detailed Requirements

### Welcome Screen (`/`)

The root route displays a welcome screen that introduces the application and directs users to select or create a plan.

| Element | Description |
|---------|-------------|
| Header | Application title and brief description |
| Call to action | Direct users to select a plan from sidebar or create new |
| Visual | Optional illustration or infographic |

#### Welcome Screen Content

- Title: "SNT Intervention Planning Tool" (or similar)
- Description: Brief explanation of what the tool does
- Guidance: "Select a plan from the sidebar to begin, or create a new plan"

### Plan Routes (`/plan` and `/plan/[planId]`)

When a plan is loaded, the main UI displays the intervention map with three view modes:
- Map view
- List view
- Budget view

#### New Plan (`/plan`)

- Creates a new unsaved plan
- Initialized with a single default rule:
  - **Title**: "Default" (or "All Districts")
  - **Criteria**: None (applies to all districts - `isAllDistricts: true`)
  - **Interventions**: CM (Case Management) only
  - **Coverage**: 70% (default)

#### Existing Plan (`/plan/[planId]`)

- Loads the predefined plan configuration
- Plan ID values: `bau`, `nsp-2026-30`
- Displays plan rules in the rules sidebar
- Map/List/Budget views reflect the plan's intervention assignments

---

## Predefined Plan Specifications

### NSP 2026-30 Plan

Plan ID: `nsp-2026-30`

#### Rule 1: High Seasonality, High Mortality

**Criteria:**
| Metric | Operator | Value |
|--------|----------|-------|
| Seasonality | >= | 0.6 |
| Mortality rate | >= | 5 per 100,000 |

**Interventions:**
- Dual AI Nets (Campaign)
- Dual AI Nets (Routine)
- SMC (Seasonal Malaria Chemoprevention)
- R21 (Vaccine)
- CM (Case Management)

#### Rule 2: Low Seasonality, High Incidence, High Mortality, High Resistance

**Criteria:**
| Metric | Operator | Value |
|--------|----------|-------|
| Seasonality | < | 0.6 |
| Incidence rate | >= | 300 per 1,000 |
| Mortality rate | >= | 5 per 100,000 |
| Insecticide resistance | >= | 0.75 |

**Interventions:**
- Dual AI Nets (Campaign)
- Dual AI Nets (Routine)
- PMC (Perennial Malaria Chemoprevention)
- R21 (Vaccine)
- CM (Case Management)

#### Rule 3: Low Seasonality, High Incidence, Low Mortality, High Resistance

**Criteria:**
| Metric | Operator | Value |
|--------|----------|-------|
| Seasonality | < | 0.6 |
| Incidence rate | >= | 300 per 1,000 |
| Mortality rate | < | 5 per 100,000 |
| Insecticide resistance | >= | 0.75 |

**Interventions:**
- Dual AI Nets (Campaign)
- Dual AI Nets (Routine)
- PMC (Perennial Malaria Chemoprevention)
- CM (Case Management)

#### Default Rule: All Remaining Districts

**Criteria:** None (applies to all districts not matched by above rules)

**Interventions:**
- Standard Pyrethroid Nets (Campaign)
- Standard Pyrethroid Nets (Routine)
- CM (Case Management)

---

### BAU Plan

Plan ID: `bau`

#### Rule 1: Low Seasonality, High Incidence, Low Mortality, High Resistance

**Criteria:**
| Metric | Operator | Value |
|--------|----------|-------|
| Seasonality | < | 0.7 |
| Incidence rate | >= | 500 per 1,000 |
| Mortality rate | < | 10 per 100,000 |
| Insecticide resistance | >= | 0.75 |

**Interventions:**
- Dual AI Nets (Campaign)
- Dual AI Nets (Routine)
- PMC (Perennial Malaria Chemoprevention)
- CM (Case Management)

#### Default Rule: All Remaining Districts

**Criteria:** None (applies to all districts not matched by above rules)

**Interventions:**
- Standard Pyrethroid Nets (Campaign)
- Standard Pyrethroid Nets (Routine)
- CM (Case Management)

---

## Sidebar Integration

### Plan Selection Behavior

| Action | Result |
|--------|--------|
| Click "BAU" in sidebar | Navigate to `/plan/bau` |
| Click "NSP 2026-30" in sidebar | Navigate to `/plan/nsp-2026-30` |
| Click "+" (New Plan) | Navigate to `/plan` |

### Active State

- The currently viewed plan is highlighted in the sidebar
- "New Plan" option shows as active when at `/plan`

---

## Data Model

### Plan Definition

```typescript
interface PlanDefinition {
  id: string;
  name: string;
  description?: string;
  rules: SavedRule[];
}
```

### Predefined Plans Storage

Predefined plans should be defined as constants in the codebase:

```typescript
// src/data/predefined-plans.ts
export const PREDEFINED_PLANS: PlanDefinition[] = [
  {
    id: 'bau',
    name: 'BAU',
    description: 'Business As Usual baseline plan',
    rules: [...] // BAU rules
  },
  {
    id: 'nsp-2026-30',
    name: 'NSP 2026-30',
    description: 'National Strategic Plan 2026-2030',
    rules: [...] // NSP rules
  }
];
```

### Rule Criteria Mapping

The criteria in predefined plans map to existing metric types:

| Plan Criteria | Metric Type |
|---------------|-------------|
| Seasonality | `seasonality` |
| Incidence rate | `incidence_rate` |
| Mortality rate | `mortality_rate` |
| Insecticide resistance | `insecticide_resistance` |

---

## Interaction Details

### Loading a Predefined Plan

1. User clicks plan name in sidebar
2. App navigates to `/plan/[planId]`
3. Plan definition is loaded from `PREDEFINED_PLANS`
4. Rules are populated in the rules sidebar
5. Map/List/Budget views update to show plan interventions

### Creating a New Plan

1. User clicks "+" (New Plan) button in sidebar
2. App navigates to `/plan`
3. A new plan is initialized with default rule only
4. User can add/edit rules as needed
5. Plan remains unsaved until explicitly saved

### Viewing Welcome Screen

1. User navigates to root (`/`)
2. Welcome screen is displayed
3. Sidebar remains visible for navigation
4. User can select a plan or create new from sidebar

---

## Technical Notes

### File Structure

```
src/
├── app/
│   ├── page.tsx                    # Welcome screen
│   └── plan/
│       ├── page.tsx                # New plan (default rule only)
│       └── [planId]/
│           └── page.tsx            # View/edit specific plan
├── data/
│   └── predefined-plans.ts         # Predefined plan definitions
```

### URL Parameters

- Plan ID is a URL parameter: `/plan/[planId]`
- Valid plan IDs: `bau`, `nsp-2026-30`
- Invalid plan IDs should redirect to `/plan` or show error

### State Management

- Current plan should be stored in React state/context
- Plan rules are loaded based on route
- Changes to predefined plans create a modified copy (don't mutate original)

---

## Non-Requirements

The following are explicitly **not** part of this feature:

- Saving/persisting user modifications to predefined plans
- User authentication or plan ownership
- Plan versioning or history
- Sharing plans via URL
- Importing/exporting plan configurations
- Plan comparison on the same screen
- Editing predefined plan definitions (they are read-only constants)
- Plan deletion (predefined plans cannot be deleted)

---

## Acceptance Criteria

### Welcome Screen

1. Root route (`/`) displays welcome screen
2. Welcome screen shows application title and description
3. Sidebar is visible and functional on welcome screen
4. Clicking a plan in sidebar navigates away from welcome screen

### Plan Loading

5. Clicking "BAU" navigates to `/plan/bau`
6. Clicking "NSP 2026-30" navigates to `/plan/nsp-2026-30`
7. Plan rules are displayed in the rules sidebar
8. Map view shows districts colored by intervention assignments
9. List view shows districts with their assigned interventions
10. Budget view reflects plan intervention costs

### New Plan

11. Clicking "+" (New Plan) navigates to `/plan`
12. New plan starts with single default rule (CM to all districts)
13. User can add new rules to the plan
14. User can modify the default rule

### NSP 2026-30 Plan

15. NSP 2026-30 plan contains 4 rules (3 criteria-based + 1 default)
16. Rule 1 applies to districts with seasonality >= 0.6 AND mortality >= 5
17. Rule 2 applies to districts with seasonality < 0.6, incidence >= 300, mortality >= 5, resistance >= 0.75
18. Rule 3 applies to districts with seasonality < 0.6, incidence >= 300, mortality < 5, resistance >= 0.75
19. Default rule applies to all remaining districts

### BAU Plan

20. BAU plan contains 2 rules (1 criteria-based + 1 default)
21. Rule 1 applies to districts with seasonality < 0.7, incidence >= 500, mortality < 10, resistance >= 0.75
22. Default rule applies to all remaining districts

### Sidebar Integration

23. Currently active plan is highlighted in sidebar
24. Navigation between plans updates sidebar highlight
25. "/plan" route shows "New Plan" as active (or no plan selected)

---

## Implementation Phases

### Phase 1: Routing Structure

- Create `/plan/[planId]/page.tsx` route
- Create `/plan/page.tsx` for new plans
- Modify `/page.tsx` to show welcome screen
- Update sidebar navigation links

### Phase 2: Predefined Plans Data

- Create `src/data/predefined-plans.ts`
- Define BAU plan with rules and criteria
- Define NSP 2026-30 plan with rules and criteria
- Map interventions to correct IDs

### Phase 3: Plan Loading

- Load plan definition based on route parameter
- Initialize rules state from plan definition
- Connect to existing map/list/budget views
- Handle invalid plan IDs

### Phase 4: Welcome Screen

- Design and implement welcome screen UI
- Add appropriate messaging and guidance
- Ensure responsive layout

### Phase 5: Integration Testing

- Verify all plans load correctly
- Test intervention assignments match specifications
- Validate criteria matching logic
- Test navigation flows
