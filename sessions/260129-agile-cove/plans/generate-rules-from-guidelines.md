# Plan: Generate Rules from Guidelines

## Summary
Add a magic wand icon next to the Plus button in the rules sidebar that opens a dropdown menu to generate rules from available guidelines (starting with INTERVENTION_GUIDELINES). The generated rules will match the WHO Guidelines (Cumulative) structure.

## Steps

### 1. Create rules generator utility
**File:** `src/utils/generate-rules-from-guidelines.ts`
- Create a function `generateRulesFromGuidelines()` that converts INTERVENTION_GUIDELINES to SavedRules
- Use cumulative logic: each guideline becomes a rule that includes its interventions plus maintains earlier interventions where applicable
- Generate proper rule IDs, titles, colors, and intervention mappings
- Map guideline criteria to RuleCriterion format
- Handle intervention category mapping (ITNs/LLINS → CATEGORY_NETS_CAMPAIGN + CATEGORY_NETS_ROUTINE, etc.)

### 2. Update RulesSidebar component
**File:** `src/components/intervention-map/rules-sidebar/rules-sidebar.tsx`
- Import dropdown menu components and Wand2 icon from lucide-react
- Add `onGenerateFromGuidelines` callback prop
- Replace the single Plus button with a flex container containing both buttons
- Add magic wand button with dropdown menu
- Dropdown should have "Generate from" label and "WHO Guidelines (2024)" as the first option
- Call the generator function when option is clicked and pass results to callback

### 3. Wire up to parent component
**File:** `src/components/intervention-map/intervention-map.tsx` or equivalent
- Add handler for `onGenerateFromGuidelines` that replaces current rules with generated ones
- Ensure generated rules include a default rule at the beginning (like WHO_GUIDELINES_CUMULATIVE_PLAN)

### 4. Match WHO Guidelines (Cumulative) output
- Verify the generated rules match the structure in `WHO_GUIDELINES_CUMULATIVE_PLAN`
- Ensure rule order: Default → ITNs/LLINS → RTS,S → IRS → SMC → PMC+IPTp → MDA
- Verify intervention mappings are correct
- Confirm colors match or use a consistent color scheme

## Technical Details

**Intervention Mapping:**
- ITNs/LLINS → PBO nets (Campaign: 84, Routine: 87)
- IRS → IRS Organophosphate (92) + PBO nets
- SMC → SMC (82) + R21 (89) + PBO nets
- PMC → PMC (81) + IPTp (80) + R21 + PBO nets
- IPTp → Already included in PMC rule
- MDA → MDA Multiple (95) + R21 + Dual AI nets (Campaign: 83, Routine: 86)
- RTS,S → R21 (89) + PBO nets

**Colors (from predefined-plans.ts):**
- Default: #9ca3af (Gray)
- ITNs/LLINS: #f97316 (Orange)
- RTS,S: #f59e0b (Amber)
- IRS: #3b82f6 (Blue)
- SMC: #22c55e (Green)
- PMC+IPTp: #a855f7 (Purple)
- MDA: #ec4899 (Pink)

## Success Criteria
- Magic wand icon appears next to Plus button
- Clicking it opens a dropdown with "Generate from" label
- Selecting "WHO Guidelines (2024)" generates the same rule set as WHO Guidelines (Cumulative)
- Generated rules apply correctly to the map
