# Add Rule Visibility Toggle Feature

## Summary
Add an "eye" icon button to each rule card that toggles the visibility of that rule on the map and in the list view. When a rule is marked as "hidden" (not visible), it should:
- Not be applied to districts on the map or in the list view
- Display with 20% opacity in the rules sidebar
- Collapse to show only the title (hide criteria, exceptions, and interventions)
- Show an "eye-off" icon instead of an "eye" icon

## Implementation Steps

### 1. Update SavedRule Type Definition
**File:** [`src/types/rule.ts`](/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/types/rule.ts)

- Add optional `isVisible?: boolean` property to `SavedRule` interface
- Default to `true` for backward compatibility with existing rules

### 2. Update RuleCard Component
**File:** [`src/components/intervention-map/rules-sidebar/rule-card.tsx`](/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/components/intervention-map/rules-sidebar/rule-card.tsx)

- Import `Eye` and `EyeOff` icons from `lucide-react`
- Add `onToggleVisibility` prop to `RuleCardProps` interface
- Add eye icon button next to the delete button
  - Show `Eye` icon when `rule.isVisible !== false`
  - Show `EyeOff` icon when `rule.isVisible === false`
- Apply conditional styling when rule is hidden:
  - Reduce card opacity to 20% using `opacity-20` class
  - Hide the content section (criteria, exceptions, interventions) completely
  - Keep only the header with title and color indicator visible
- Call `onToggleVisibility(rule.id)` when eye button is clicked

### 3. Update RulesSidebar Component
**File:** [`src/components/intervention-map/rules-sidebar/rules-sidebar.tsx`](/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/components/intervention-map/rules-sidebar/rules-sidebar.tsx)

- Add `onToggleVisibility` prop to `RulesSidebarProps` interface
- Pass `onToggleVisibility` to each `RuleCard` component

### 4. Update Page Component - Handler
**File:** [`src/app/plan/[[...planId]]/page.tsx`](/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/app/plan/[[...planId]]/page.tsx:317-329)

- Add `handleToggleRuleVisibility` callback function
  - Toggle the `isVisible` property of the specified rule
  - Update the `savedRules` state
  - The existing `useEffect` will automatically re-apply rules

### 5. Update Rule Application Logic
**File:** [`src/app/plan/[[...planId]]/page.tsx`](/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/app/plan/[[...planId]]/page.tsx:171-265)

- Filter out hidden rules (where `isVisible === false`) before applying rules to districts
- Update both the default rule selection and non-default rules loop
- Only process rules where `rule.isVisible !== false`

### 6. Update Rule Serialization
**File:** [`src/app/plan/[[...planId]]/page.tsx`](/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/app/plan/[[...planId]]/page.tsx:38-68)

- Add `isVisible` to the `serializeRule` function to ensure visibility changes are tracked
- This ensures the "edited" state detection works correctly when toggling visibility

### 7. Update List View Color Logic
**File:** [`src/hooks/use-district-rules.ts`](/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/hooks/use-district-rules.ts:233-283)

- Filter out hidden rules in `getLastMatchingRuleColor` function
- Add check: `if (rule.isVisible === false) continue;` at the start of the loop
- This ensures hidden rules don't color the rows in the list view

### 8. Wire Everything Together
**File:** [`src/app/plan/[[...planId]]/page.tsx`](/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/app/plan/[[...planId]]/page.tsx)

- Pass `onToggleVisibility={handleToggleRuleVisibility}` to `RulesSidebar` component

## Technical Considerations

1. **Backward Compatibility:** Using optional `isVisible?: boolean` with implicit `true` default ensures existing rules without this property will work correctly

2. **State Management:** Toggling visibility updates the `savedRules` state, which triggers the rule application `useEffect` automatically - no manual map updates needed

3. **Visual Feedback:** The collapsed state + reduced opacity clearly indicates the rule is disabled while still showing which rule it is

4. **User Experience:** The eye icon is intuitive and commonly used for visibility toggles in UIs

5. **Edit Detection:** Including `isVisible` in rule serialization ensures toggling visibility marks the plan as edited

## Files to Modify

1. `/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/types/rule.ts`
2. `/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/components/intervention-map/rules-sidebar/rule-card.tsx`
3. `/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/components/intervention-map/rules-sidebar/rules-sidebar.tsx`
4. `/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/app/plan/[[...planId]]/page.tsx`
5. `/Users/jeromecordiez/Dropbox/sandbox/claude/intervention-map/src/hooks/use-district-rules.ts`
