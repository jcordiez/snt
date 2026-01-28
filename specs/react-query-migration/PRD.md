# React Query Migration PRD

## Overview

Replace individual API calls and manual data fetching patterns with React Query (TanStack Query) to achieve proper caching, request deduplication, and lifecycle management of server state.

## Problem Statement

The current codebase uses vanilla React hooks with `useEffect` for all data fetching. Each custom hook manually manages `isLoading`, `error`, and `data` states. This approach leads to:

1. **No request deduplication** - Same API endpoint can be called multiple times if used by different components
2. **Manual loading state management** - Every hook tracks its own loading/error states
3. **No caching** - Data is re-fetched on every component mount
4. **Race condition complexity** - Uses `useRef` flags to track initialization state
5. **No request cancellation** - In-flight requests continue even when components unmount
6. **No background sync** - No mechanism for data refresh or stale-while-revalidate patterns
7. **Batch request complexity** - `useMultipleMetricValues` manually orchestrates `Promise.all` with all-or-nothing error handling

## Goals

1. **Centralized caching** - Cache API responses to eliminate redundant network requests
2. **Automatic request deduplication** - Multiple components requesting the same data share a single request
3. **Declarative data fetching** - Simplify hooks by removing manual state management
4. **Granular error handling** - Handle errors per-request instead of batch failures
5. **Background updates** - Enable stale-while-revalidate patterns for improved UX
6. **DevTools support** - Enable React Query DevTools for debugging cache state

## Non-Goals

- Server-side data mutations (current app is read-only for API data)
- Optimistic updates (not applicable to current use cases)
- Infinite scroll / pagination (not used in current UI)

## Current State Analysis

### API Endpoints

| Endpoint | Purpose | Data Characteristics |
|----------|---------|---------------------|
| `/api/orgunits` | Geographic/organizational units for mapping | Static, ~2MB, changes rarely |
| `/api/intervention-categories` | Intervention categories and interventions | Static, small payload |
| `/api/metric-types` | Metric metadata and groupings | Static, small payload |
| `/api/metricvalues?id={id}` | Metric values per district | Semi-static, medium payload |

### Current Hooks

| Hook | API Called | Current Pattern |
|------|------------|-----------------|
| `useOrgUnits()` | `/api/orgunits` | `useEffect` + `useState` |
| `useInterventionCategories()` | `/api/intervention-categories` | `useEffect` + `useState` |
| `useMetricTypes()` | `/api/metric-types` | `useEffect` + `useState` |
| `useMetricValues(id)` | `/api/metricvalues?id={id}` | `useEffect` + `useState` with dependency |
| `useMultipleMetricValues(ids)` | Multiple `/api/metricvalues` | `Promise.all` orchestration |

## Proposed Architecture

### Package Installation

```bash
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools
```

### Query Client Configuration

Create `/src/lib/query-client.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000,   // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Provider Setup

Wrap app in `/src/app/layout.tsx` or create `/src/app/providers.tsx`:

```typescript
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Query Key Structure

Establish consistent query key conventions:

```typescript
// /src/lib/query-keys.ts
export const queryKeys = {
  orgUnits: ['orgunits'] as const,
  interventionCategories: ['intervention-categories'] as const,
  metricTypes: ['metric-types'] as const,
  metricValues: (id: number) => ['metric-values', id] as const,
  allMetricValues: (ids: number[]) => ['metric-values', { ids }] as const,
};
```

## Migration Plan

### Phase 1: Setup Infrastructure

1. Install React Query packages
2. Create query client configuration
3. Set up provider in app layout
4. Create query keys module
5. Add DevTools (dev only)

### Phase 2: Migrate Static Data Hooks

Migrate hooks that fetch data once without parameters:

#### 2.1 `useOrgUnits`

**Before:**
```typescript
const [data, setData] = useState<OrgUnit[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  fetch('/api/orgunits')
    .then(res => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setIsLoading(false));
}, []);
```

**After:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

async function fetchOrgUnits(): Promise<OrgUnit[]> {
  const response = await fetch('/api/orgunits');
  if (!response.ok) throw new Error('Failed to fetch org units');
  return response.json();
}

export function useOrgUnits() {
  const query = useQuery({
    queryKey: queryKeys.orgUnits,
    queryFn: fetchOrgUnits,
    staleTime: Infinity, // Data rarely changes
  });

  // Preserve existing computed values using useMemo
  const geoJson = useMemo(() => transformToGeoJson(query.data), [query.data]);
  const provinces = useMemo(() => extractProvinces(query.data), [query.data]);

  return {
    data: geoJson,
    provinces,
    isLoading: query.isLoading,
    error: query.error,
    // Note: updateDistricts callback needs separate handling
  };
}
```

#### 2.2 `useInterventionCategories`

```typescript
export function useInterventionCategories() {
  const query = useQuery({
    queryKey: queryKeys.interventionCategories,
    queryFn: async () => {
      const response = await fetch('/api/intervention-categories');
      if (!response.ok) throw new Error('Failed to fetch intervention categories');
      return response.json();
    },
    staleTime: Infinity,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
```

#### 2.3 `useMetricTypes`

```typescript
export function useMetricTypes() {
  const query = useQuery({
    queryKey: queryKeys.metricTypes,
    queryFn: async () => {
      const response = await fetch('/api/metric-types');
      if (!response.ok) throw new Error('Failed to fetch metric types');
      return response.json();
    },
    staleTime: Infinity,
  });

  const groupedByCategory = useMemo(
    () => groupMetricsByCategory(query.data),
    [query.data]
  );

  return {
    data: query.data ?? [],
    groupedByCategory,
    isLoading: query.isLoading,
    error: query.error,
  };
}
```

### Phase 3: Migrate Parameterized Hooks

#### 3.1 `useMetricValues(id)`

```typescript
export function useMetricValues(metricTypeId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.metricValues(metricTypeId!),
    queryFn: async () => {
      const response = await fetch(`/api/metricvalues?id=${metricTypeId}`);
      if (!response.ok) throw new Error('Failed to fetch metric values');
      return response.json();
    },
    enabled: metricTypeId !== null, // Don't fetch if no ID
  });

  const valuesByOrgUnit = useMemo(
    () => createOrgUnitLookup(query.data),
    [query.data]
  );

  const { min, max } = useMemo(
    () => computeMinMax(query.data),
    [query.data]
  );

  return {
    data: query.data ?? [],
    valuesByOrgUnit,
    min,
    max,
    isLoading: query.isLoading,
    error: query.error,
  };
}
```

#### 3.2 `useMultipleMetricValues(ids)`

Replace `Promise.all` orchestration with `useQueries`:

```typescript
import { useQueries } from '@tanstack/react-query';

export function useMultipleMetricValues(metricTypeIds: number[]) {
  const queries = useQueries({
    queries: metricTypeIds.map(id => ({
      queryKey: queryKeys.metricValues(id),
      queryFn: async () => {
        const response = await fetch(`/api/metricvalues?id=${id}`);
        if (!response.ok) throw new Error(`Failed to fetch metric ${id}`);
        return { id, values: await response.json() };
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = queries.some(q => q.isLoading);
  const error = queries.find(q => q.error)?.error ?? null;

  const metricValuesByType = useMemo(() => {
    const map = new Map<number, Map<string, number>>();
    for (const query of queries) {
      if (query.data) {
        const lookup = new Map<string, number>();
        for (const mv of query.data.values) {
          lookup.set(mv.org_unit, mv.value);
        }
        map.set(query.data.id, lookup);
      }
    }
    return map;
  }, [queries]);

  return {
    metricValuesByType,
    isLoading,
    error,
  };
}
```

### Phase 4: Cleanup and Optimization

1. Remove manual `useState` and `useEffect` patterns from migrated hooks
2. Add error boundaries for React Query errors
3. Configure appropriate `staleTime` per query type
4. Add loading skeletons leveraging React Query's `isPending` vs `isLoading`

### Phase 5: Testing and Validation

1. Verify all API calls are deduplicated (check Network tab)
2. Confirm cache is populated correctly (DevTools)
3. Test component remounting doesn't trigger refetch
4. Validate error handling per individual request
5. Performance test with concurrent component usage

## API Surface Changes

The migrated hooks should maintain backward-compatible return signatures:

```typescript
// All hooks should continue to return:
{
  data: T,
  isLoading: boolean,
  error: Error | null,
  // Plus any existing computed values
}
```

Components consuming these hooks should require minimal changes.

## Configuration Options

### Recommended Defaults

| Query Type | staleTime | gcTime | Rationale |
|------------|-----------|--------|-----------|
| Org Units | `Infinity` | `Infinity` | Geographic data never changes in session |
| Intervention Categories | `Infinity` | `Infinity` | Static reference data |
| Metric Types | `Infinity` | `Infinity` | Static metadata |
| Metric Values | `5 minutes` | `30 minutes` | May update, but infrequently |

### DevTools

Enable in development only:

```typescript
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

## Success Metrics

1. **Request Deduplication** - Same metric values requested by multiple components result in single network request
2. **Cache Hit Rate** - Navigation between pages uses cached data without refetch
3. **Code Reduction** - Hooks are shorter and easier to maintain
4. **Error Granularity** - Individual metric fetch failures don't break entire page

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing component contracts | Maintain exact return type signatures |
| Bundle size increase | React Query is ~12KB gzipped, acceptable tradeoff |
| Learning curve for team | Well-documented, popular library |
| Cache invalidation bugs | Use DevTools to inspect cache state |

## Dependencies

- `@tanstack/react-query` ^5.x
- `@tanstack/react-query-devtools` ^5.x (dev dependency)

## Timeline

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | Infrastructure setup | ✅ Complete |
| Phase 2 | Static data hooks (3 hooks) | ✅ Complete |
| Phase 3 | Parameterized hooks (2 hooks) | ✅ Complete |
| Phase 4 | Cleanup and optimization | ✅ Complete |
| Phase 5 | Testing and validation | Manual testing required |

**Implementation Status: COMPLETE** (2026-01-28)

All code migration work is finished. Phase 5 validation requires manual testing with browser dev tools.

## Open Questions

1. Should we prefetch critical data (org units, metric types) at app startup?
2. Do we need to persist cache across sessions using `persistQueryClient`?
3. Should loading states show skeletons or spinners? (UX decision)

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [Query Key Best Practices](https://tanstack.com/query/latest/docs/react/guides/query-keys)
