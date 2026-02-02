# Plan: Add Drag & Drop Reordering to Rules List

## Summary

Add drag & drop reordering capability to the rules sidebar using @dnd-kit. When users reorder rules, the map will automatically update to reflect the new rule priority order (since later rules override earlier ones).

## Current State Analysis

### Rules Flow
1. **State Management** ([page.tsx:90](../../src/app/plan/[[...planId]]/page.tsx:90))
   - Rules stored in `savedRules` state
   - Updated via `setSavedRules` callback

2. **Rule Application** ([page.tsx:174-272](../../src/app/plan/[[...planId]]/page.tsx:174-272))
   - Rules are applied to the map in order
   - Later rules override earlier rules for overlapping districts
   - Automatically re-applies when `savedRules` changes

3. **UI Rendering** ([rules-sidebar.tsx:99-111](../../src/components/intervention-map/rules-sidebar/rules-sidebar.tsx:99-111))
   - Rules mapped to `RuleCard` components
   - No drag & drop functionality currently

### Key Insight
The rule order matters because the map application logic processes rules sequentially, with later rules overriding earlier ones. Reordering will immediately trigger the useEffect that re-applies rules to the map.

## Implementation Steps

### 1. Install @dnd-kit packages
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Packages needed:**
- `@dnd-kit/core` - Core drag & drop functionality
- `@dnd-kit/sortable` - Sortable list utilities
- `@dnd-kit/utilities` - Helper utilities (CSS transform, etc.)

### 2. Add reorder handler to page component

**Location:** `src/app/plan/[[...planId]]/page.tsx`

Add a new handler:
```typescript
const handleReorderRules = useCallback((newOrder: SavedRule[]) => {
  setSavedRules(newOrder);
}, []);
```

Pass to RulesSidebar:
```typescript
<RulesSidebar
  rules={savedRules}
  // ... other props
  onReorderRules={handleReorderRules}
/>
```

### 3. Update RulesSidebar component

**Location:** `src/components/intervention-map/rules-sidebar/rules-sidebar.tsx`

**Changes:**
- Add `onReorderRules` prop
- Wrap rules list with `DndContext` and `SortableContext`
- Handle drag end event to reorder rules
- Convert RuleCard usage to sortable version

**Implementation approach:**
```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// In component:
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    const oldIndex = rules.findIndex((r) => r.id === active.id);
    const newIndex = rules.findIndex((r) => r.id === over.id);

    const newOrder = arrayMove(rules, oldIndex, newIndex);
    onReorderRules?.(newOrder);
  }
}
```

### 4. Create SortableRuleCard component

**Location:** `src/components/intervention-map/rules-sidebar/sortable-rule-card.tsx`

**Purpose:** Wrapper around RuleCard that adds drag & drop functionality

**Key features:**
- Uses `useSortable` hook from @dnd-kit/sortable
- Adds drag handle visual indicator (grip icon)
- Applies transform and transition styles during drag
- Forwards all props to RuleCard

**Structure:**
```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { RuleCard } from './rule-card';

export function SortableRuleCard({ rule, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <RuleCard rule={rule} {...props} />
    </div>
  );
}
```

### 5. Update RuleCard for drag handle spacing

**Location:** `src/components/intervention-map/rules-sidebar/rule-card.tsx`

**Minor adjustment:** Add left padding to make room for drag handle:
```typescript
className="group rounded-lg border ... pl-8" // Add pl-8 for drag handle space
```

### 6. Update types

**Location:** `src/components/intervention-map/rules-sidebar/rules-sidebar.tsx`

Add to `RulesSidebarProps`:
```typescript
interface RulesSidebarProps {
  // ... existing props
  onReorderRules?: (newOrder: SavedRule[]) => void;
}
```

## Testing Checklist

- [ ] Rules can be dragged and dropped to reorder
- [ ] Map updates automatically when rules are reordered
- [ ] Drag handle appears on hover
- [ ] Visual feedback during drag (opacity, cursor)
- [ ] Keyboard navigation works (arrow keys + space/enter)
- [ ] Works with both criteria-based and "All districts" rules
- [ ] Works with hidden rules (isVisible: false)
- [ ] Rule exceptions are preserved during reordering
- [ ] No console errors during drag operations

## Edge Cases to Consider

1. **Empty rules list**: Should gracefully handle (no drag context needed)
2. **Single rule**: Should show drag handle but no reordering possible
3. **Hidden rules**: Should still be reorderable (they affect rule evaluation order)
4. **Long rule lists**: Scrollable container should work with drag & drop

## Why @dnd-kit?

- **Modern & performant**: Uses pointer events, not mouse events
- **Accessible**: Built-in keyboard navigation support
- **Flexible**: Not opinionated about rendering
- **Lightweight**: Tree-shakeable, modular architecture
- **Well-maintained**: Active development, good TypeScript support

## Expected User Experience

1. User hovers over a rule → Drag handle (grip icon) appears on the left
2. User clicks and drags the handle → Rule becomes semi-transparent
3. User drops the rule → Rules reorder, map immediately updates
4. Result: Rule priority changes reflected on the map

## Files to Modify

1. `package.json` - Add @dnd-kit dependencies
2. `src/app/plan/[[...planId]]/page.tsx` - Add reorder handler
3. `src/components/intervention-map/rules-sidebar/rules-sidebar.tsx` - Add DndContext
4. `src/components/intervention-map/rules-sidebar/sortable-rule-card.tsx` - New file
5. `src/components/intervention-map/rules-sidebar/rule-card.tsx` - Minor styling adjustment

## Estimated Complexity

- **Low-Medium**: @dnd-kit is straightforward for vertical list sorting
- **Main work**: Wiring up the components and handlers correctly
- **No breaking changes**: Purely additive feature
