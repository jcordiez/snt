# Add Province Filtering to Miniature Maps

## Summary
Enable province filtering in comparison mode miniature maps. When a province is selected, the miniature maps will filter to show only districts within that province and auto-zoom to fit the province bounds.

## Approach

The implementation will pass the `selectedProvince` state through the component hierarchy and apply filtering + auto-zoom in the miniature map component.

**No active/inactive layers** - Districts outside the selected province will simply not be rendered (removed from the GeoJSON source).

**Auto-zoom required** - Miniature maps will calculate and zoom to the bounds of the selected province.

## Steps

### 1. Update Plan Page to Pass Province State
**File**: `src/app/plan/[[...planId]]/page.tsx`

- Pass `selectedProvince` as a prop to the `<ComparisonSidebar>` component (around line 549)
- The state already exists at line 86, just need to thread it through

### 2. Update ComparisonSidebar to Accept and Forward Province
**File**: `src/components/comparison-sidebar/comparison-sidebar.tsx`

- Add `selectedProvince?: Province | null` to component props interface
- Pass it down to each `<MiniatureMap>` component (in the map tab rendering)
- Update the `React.memo` equality check to include selectedProvince

### 3. Update MiniatureMap to Filter Districts and Auto-Zoom
**File**: `src/components/comparison-sidebar/miniature-map.tsx`

- Add `selectedProvince?: Province | null` to props interface
- Filter the districts GeoJSON to only include features where `feature.properties.regionId === selectedProvince.id`
- Calculate province bounds from the filtered districts
- Apply bounds to the map using `map.fitBounds()` with appropriate padding
- Handle the "no province selected" case (show all districts, use default center/zoom)
- Update the `React.memo` equality check to re-render when selectedProvince changes

### 4. Test the Implementation

- Verify that selecting a province filters all miniature maps
- Verify that miniature maps auto-zoom to the province bounds
- Verify that deselecting province (All Provinces) restores full view
- Check that switching between provinces works smoothly
- Ensure the main map filtering still works correctly

## Technical Details

**Province Filtering**:
```typescript
const filteredDistricts = useMemo(() => {
  if (!selectedProvince) return districts;

  return {
    ...districts,
    features: districts.features.filter(
      f => f.properties.regionId === selectedProvince.id
    )
  };
}, [districts, selectedProvince]);
```

**Auto-Zoom Logic**:
```typescript
useEffect(() => {
  if (!map || !selectedProvince || !filteredDistricts.features.length) {
    // Reset to default view
    map?.setCenter([23.6, -2.9]);
    map?.setZoom(3.2);
    return;
  }

  // Calculate bounds from filtered districts
  const bounds = new maplibregl.LngLatBounds();
  filteredDistricts.features.forEach(feature => {
    // Add coordinates to bounds
  });

  map.fitBounds(bounds, { padding: 20, maxZoom: 6 });
}, [map, selectedProvince, filteredDistricts]);
```

## Files Modified

1. `src/app/plan/[[...planId]]/page.tsx`
2. `src/components/comparison-sidebar/comparison-sidebar.tsx`
3. `src/components/comparison-sidebar/miniature-map.tsx`

## Benefits

- Consistent filtering behavior between main map and comparison maps
- Users can compare how different plans affect a specific province
- Better focus on regional planning and analysis
- Cleaner visual presentation with auto-zoom
