# Fix: Intervention Mix Colors Not Showing on Map

## Problem Summary

1. **Map shows all districts in gray** - Districts display with CM-only gray color even after interventions are assigned
2. **Legend doesn't show district counts** - Need to display count per intervention mix (e.g., "CM+IPTp (236 districts)")

---

## Root Cause Analysis

### Bug 1: Legend Reads Wrong Property

**Location:** `src/components/intervention-map/map-legend.tsx:35-39`

```typescript
// CURRENT (BROKEN)
for (const feature of districts.features) {
  const { interventionMix } = feature.properties;
  if (interventionMix?.displayLabel) {
    mixLabels.add(interventionMix.displayLabel);
  }
}
```

**Issue:** The legend reads `interventionMix.displayLabel`, but:
- `interventionMix` contains a `Map` object which is not JSON-serializable
- The flat property `interventionMixLabel` should be used instead (this is the property MapLibre uses)

### Bug 2: Map Color Expression Uses Wrong Data Source

**Location:** `src/components/intervention-map/district-layer.tsx:190-206`

The `mixColorMap` is computed correctly from `orgUnitsData.features`, but when the source data is updated via `source.setData()`, the non-serializable `interventionMix` property may cause issues.

Additionally, the initial paint property is a static color that relies on the effect to update it with a dynamic expression.

---

## Fix Tasks

### Task 1: Fix Legend to Use `interventionMixLabel` Property

**File:** `src/components/intervention-map/map-legend.tsx`

**Change:** Replace reading of `interventionMix.displayLabel` with `interventionMixLabel`

```typescript
// FIXED
for (const feature of districts.features) {
  const mixLabel = feature.properties.interventionMixLabel;
  if (mixLabel) {
    mixLabels.add(mixLabel);
  }
}
```

### Task 2: Add District Counts to Legend

**File:** `src/components/intervention-map/map-legend.tsx`

**Changes:**

1. Update `LegendItem` interface:
```typescript
interface LegendItem {
  color: string;
  label: string;
  districtCount: number;
}
```

2. Count districts per intervention mix in `computeLegendItems()`:
```typescript
// Count districts per intervention mix
const districtCountMap = new Map<string, number>();
for (const feature of districts.features) {
  const mixLabel = feature.properties.interventionMixLabel;
  if (mixLabel) {
    districtCountMap.set(mixLabel, (districtCountMap.get(mixLabel) ?? 0) + 1);
  }
}

// Create legend items with counts
return sortedLabels.map((label) => ({
  color: getColorForInterventionMix(label),
  label,
  districtCount: districtCountMap.get(label) ?? 0,
}));
```

3. Update legend UI to display counts:
```typescript
<span className="text-xs text-gray-600">
  {item.label} ({item.districtCount})
</span>
```

### Task 3: Ensure Color Expression is Applied on Data Update

**File:** `src/components/intervention-map/district-layer.tsx`

**Issue:** The effect that sets the color expression may not trigger reliably when `orgUnitsData` changes.

**Fix:** Ensure the color expression is always rebuilt and applied when `mixColorMap` changes:

1. Remove the `if (mixColorMap.size > 0)` guard - always set the expression
2. Handle empty case with a fallback expression

```typescript
useEffect(() => {
  if (!isLoaded || !map || !layersAdded.current) return;

  // Build match cases from mixColorMap
  const matchCases: string[] = [];
  mixColorMap.forEach((color, label) => {
    matchCases.push(label, color);
  });

  // Always set the color expression (with at least the default fallback)
  const colorExpression = matchCases.length > 0
    ? [
        "match",
        ["get", "interventionMixLabel"],
        ...matchCases,
        PREDEFINED_INTERVENTION_COLORS["CM"],
      ]
    : PREDEFINED_INTERVENTION_COLORS["CM"];

  map.setPaintProperty(ACTIVE_FILL_LAYER_ID, "fill-color", colorExpression as any);

  // Update source data
  const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  if (source && orgUnitsData) {
    source.setData(orgUnitsData);
  }
}, [isLoaded, map, mixColorMap, orgUnitsData]);
```

### Task 4: Verify Data Serialization

**File:** `src/hooks/use-orgunits.ts`

**Verify:** The `interventionMix` property with `Map` object should not be added to GeoJSON properties passed to MapLibre. Only `interventionMixLabel` (string) should be used for map rendering.

Current code already handles this partially (comment at line 147), but need to ensure `updateDistricts()` doesn't add the Map object to properties that get passed to MapLibre.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/intervention-map/map-legend.tsx` | Fix property access, add district counts |
| `src/components/intervention-map/district-layer.tsx` | Fix color expression application |
| `src/hooks/use-orgunits.ts` | Verify/fix serialization (if needed) |

---

## Verification Steps

1. Start dev server: `npm run dev`
2. Open http://localhost:3001
3. Verify all districts show in darker gray (CM only) initially
4. Use intervention wizard to assign interventions to districts
5. Verify:
   - Assigned districts change to unique colors matching the legend
   - Legend shows intervention mix labels with district counts (e.g., "CM + IPTp (15)")
   - Hovering over districts shows correct intervention mix
6. Assign different intervention mixes to different districts
7. Verify each mix has a distinct color on both map and legend
