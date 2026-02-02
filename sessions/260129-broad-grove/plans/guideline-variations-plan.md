# Guideline Variations Implementation Plan

## Summary
Generate 3-5 variations of intervention guidelines with different threshold values and criteria, and redesign the guidelines page with a 240px left sidebar navigation that replaces the search functionality.

## Guideline Variations Strategy

### Variation 1: **Conservative (Standard WHO)**
- Use current thresholds as baseline
- All interventions included
- Most restrictive criteria

### Variation 2: **Moderate (Resource-Constrained)**
- Skip IRS (as suggested)
- Increase thresholds by 20-30% for ITNs/LLINs
- Remove some criteria (e.g., indoor biting requirement)
- Target: Focus on most cost-effective interventions

### Variation 3: **Aggressive (High-Risk Areas)**
- Lower thresholds by 30-40%
- Add more interventions
- More lenient criteria to cast wider net
- Target: Maximize coverage in high-burden areas

### Variation 4: **Targeted (Seasonal Focus)**
- Remove PMC (perennial)
- Skip MDA
- Emphasize SMC and seasonal interventions
- Stricter seasonality requirements

### Variation 5: **Elimination Focus (Low Transmission)**
- Skip MDA
- Lower incidence thresholds significantly (50-100 range)
- Remove prevalence criteria for some interventions
- Target: Areas moving toward elimination

## Implementation Steps

### Step 1: Create Guideline Variations Data Structure
**File:** `src/data/intervention-guidelines-variations.ts`
- Create 5 complete guideline sets with modified thresholds
- Each variation has metadata (name, description, focus)
- Reuse existing types from `intervention-guidelines.ts`

### Step 2: Update Guidelines Page Layout
**File:** `src/app/guidelines/page.tsx`
- Remove search box completely
- Add 240px fixed left sidebar
- Display list of variations in sidebar
- Main content area shows selected variation
- Default to first variation on load

### Step 3: Sidebar Component Structure
- List of variation names
- Active state for selected variation
- Simple click interaction
- Styled to match existing app design

### Step 4: Main Content Display
- Show variation metadata (name, description, focus)
- Display interventions for selected variation
- Keep collapsible accordion for interventions
- Maintain tooltip functionality for criteria

## Threshold Modifications

### Conservative (Standard WHO)
- Current values unchanged
- All 7 interventions

### Moderate (Resource-Constrained)
- **ITNs/LLINs:** incidence > 150 (was 100), prevalence > 0.02 (was 0.01)
- **IRS:** REMOVED
- **SMC:** seasonality ≥ 0.6, prevalence > 0.15 (was 0.10)
- **PMC:** incidence > 300 (was 250), prevalence > 0.15 (was 0.10)
- **IPTp:** incidence > 300 (was 250), prevalence > 0.15 (was 0.10)
- **MDA:** incidence > 500 (was 450), prevalence > 0.40 (was 0.35)
- **RTS,S:** incidence > 300 (was 250)

### Aggressive (High-Risk Areas)
- **ITNs/LLINs:** incidence > 50 (was 100), prevalence > 0.005 (was 0.01), remove indoor biting criterion
- **IRS:** incidence > 150 (was 250), prevalence > 0.05 (was 0.10), resistance > 0.3 (was 0.5)
- **SMC:** seasonality ≥ 0.5 (was 0.6), prevalence > 0.05 (was 0.10)
- **PMC:** incidence > 150 (was 250), prevalence > 0.05 (was 0.10)
- **IPTp:** incidence > 150 (was 250), prevalence > 0.05 (was 0.10)
- **MDA:** incidence > 300 (was 450), prevalence > 0.25 (was 0.35)
- **RTS,S:** incidence > 150 (was 250)

### Targeted (Seasonal Focus)
- **ITNs/LLINs:** incidence > 100, prevalence > 0.01
- **IRS:** incidence > 250, prevalence > 0.10, resistance > 0.5
- **SMC:** seasonality ≥ 0.7 (stricter, was 0.6), prevalence > 0.15 (was 0.10), attack rate > 0.15 (was 0.1)
- **PMC:** REMOVED
- **IPTp:** incidence > 250, prevalence > 0.10
- **MDA:** REMOVED
- **RTS,S:** incidence > 250

### Elimination Focus (Low Transmission)
- **ITNs/LLINs:** incidence > 50 (was 100), prevalence > 0.005 (was 0.01)
- **IRS:** incidence > 100 (was 250), remove prevalence criterion
- **SMC:** seasonality ≥ 0.6, remove prevalence criterion, attack rate > 0.05 (was 0.1)
- **PMC:** incidence > 100 (was 250), remove prevalence criterion
- **IPTp:** incidence > 100 (was 250), remove prevalence criterion
- **MDA:** REMOVED
- **RTS,S:** incidence > 100 (was 250)

## UI Layout

```
┌─────────────────────────────────────────────────┐
│ Intervention Guidelines                          │
│ WHO-recommended criteria for malaria...          │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│ Sidebar  │  Main Content Area                    │
│ (240px)  │                                       │
│          │  - Variation metadata                 │
│ • Cons.  │  - Collapsible interventions          │
│ • Mod.   │  - Criteria table                     │
│ • Aggr.  │                                       │
│ • Targ.  │                                       │
│ • Elim.  │                                       │
│          │                                       │
└──────────┴──────────────────────────────────────┘
```

## Files to Create/Modify

1. **Create:** `src/data/intervention-guidelines-variations.ts`
   - Export guideline variations data
   - Export types and utilities

2. **Modify:** `src/app/guidelines/page.tsx`
   - Remove search functionality
   - Add left sidebar with variation list
   - Add selection state management
   - Update main content to show selected variation

## Technical Considerations

- Maintain existing tooltip functionality
- Keep collapsible accordion behavior
- Ensure responsive design (sidebar could collapse on mobile)
- Reuse existing UI components (Tooltip, etc.)
- Export variations for potential use in other parts of the app

## Testing Checklist

- [ ] All 5 variations render correctly
- [ ] Sidebar navigation works
- [ ] Interventions collapse/expand properly
- [ ] Tooltips show correct information
- [ ] No search box remains
- [ ] Active state highlights current variation
- [ ] Layout looks good at different viewport sizes
