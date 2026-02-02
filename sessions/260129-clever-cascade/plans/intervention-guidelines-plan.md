# Implementation Plan: Intervention Guidelines Page

## Summary
Add a new "Intervention guidelines" page under Settings that displays WHO-recommended criteria for each malaria intervention. The page will show a grouped table with each intervention as a collapsible section containing its key indicators, criteria, and data sources.

## Design Approach
- Follow the layers page layout structure with collapsible groups
- Extract intervention guidelines from WHO_GUIDELINES_PLAN in predefined-plans.ts
- Display each intervention as a collapsible group containing:
  - Intervention name and description
  - Table of criteria showing: indicator name, WHO threshold, data source
- Include search functionality to filter interventions
- Add info tooltips for additional context about each criterion

## Data Extraction from WHO_GUIDELINES_PLAN
The WHO_GUIDELINES_PLAN contains 7 intervention rules with criteria:
1. **ITNs/LLINS**: Incidence >100, PfPr2-10 >1%, indoor-biting vectors
2. **IRS**: Incidence >250, PfPr2-10 >10%, insecticide resistance, indoor-resting vectors
3. **SMC (4 cycles)**: Seasonality ≥0.6, PfPr2-10 >10%, clinical attack rate >0.1
4. **PMC**: Incidence >250, PfPr2-10 >10%, low seasonality <0.6
5. **IPTp**: Incidence >250, PfPr2-10 >10%
6. **MDA**: Incidence >450, PfPr2-10 >35%
7. **RTS,S Vaccination**: Incidence >250

## Steps

### 1. Create Guidelines Data Structure
**File:** `src/data/intervention-guidelines.ts`
- Define TypeScript interfaces for guideline criteria
- Transform WHO_GUIDELINES_PLAN rules into displayable guideline data
- Map metric type IDs to their display names (using constants from predefined-plans.ts)
- Add data source information for each metric type:
  - Incidence rate → DHIS
  - PfPr2-10 (Prevalence) → MAP
  - Seasonality → DHIS
  - Insecticide resistance → MAP
  - Clinical attack rate → MIS
  - Vector behavior (outdoor biting, indoor resting) → MAP
  - LLIN usage → DHS

### 2. Create Guidelines Page Component
**File:** `src/app/guidelines/page.tsx`
- Follow the layers page structure (src/app/layers/page.tsx) with:
  - Page header: "Intervention Guidelines" (h1, text-2xl font-semibold)
  - Search bar with Search icon (left) and clear X button (right)
  - Collapsible groups for each intervention rule from WHO_GUIDELINES_PLAN
  - Each group shows:
    - Intervention name (from rule title)
    - Criteria count badge
    - Expandable table with rows for each criterion
- Table structure for criteria:
  - Column 1: Info icon with tooltip (metric description)
  - Column 2: Indicator name (metric type name)
  - Column 3: WHO criteria (operator + threshold value)
  - Column 4: Data source (DHIS/MAP/MIS/DHS)
- Search filters interventions by name (case-insensitive)
- Use TooltipProvider wrapper for all tooltips
- Reuse UI components: Input, Button, Tooltip, ChevronDown/ChevronRight icons

### 3. Update Sidebar Navigation
**File:** `src/components/app-sidebar.tsx`
- Add new SidebarMenuItem in the Settings group (after "Metric layers", line ~131)
- Import icon from lucide-react (recommended: `BookOpen` or `FileText`)
- Structure:
  ```tsx
  <SidebarMenuItem>
    <SidebarMenuButton asChild tooltip="Intervention guidelines" isActive={pathname === "/guidelines"}>
      <Link href="/guidelines">
        <BookOpen className="size-4" />
        <span>Intervention guidelines</span>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
  ```
- Active state uses pathname comparison (already available in component)

### 4. Create Supporting UI Components (if needed)
- Reuse existing components from layers page:
  - Collapsible groups
  - Search input
  - Tooltips
  - Table rows

## Technical Notes
- Extract guidelines from WHO_GUIDELINES_PLAN (predefined-plans.ts)
- Static data structure - no API integration needed
- Reuse metric type ID constants from predefined-plans.ts
- Follow layers page component structure:
  - Collapsible groups with ChevronRight/ChevronDown icons
  - Search bar with clear button
  - Info tooltips using shadcn/ui Tooltip components
  - Consistent spacing and styling
- Data sources mapping:
  - DHIS: District Health Information System
  - MAP: Malaria Atlas Project
  - MIS: Malaria Indicator Survey
  - DHS: Demographic and Health Surveys

## Files to Create/Modify
1. **Create:** `src/data/intervention-guidelines.ts` - Guidelines data structure
2. **Create:** `src/app/guidelines/page.tsx` - Guidelines page component
3. **Modify:** `src/components/app-sidebar.tsx` - Add navigation menu item

## Validation
- Verify the new menu item appears in the Settings section
- Confirm the guidelines page loads at `/guidelines` route
- Test search functionality filters interventions correctly
- Ensure collapsible groups work smoothly
- Verify responsive design matches the layers page
- Check that all intervention criteria display correctly
