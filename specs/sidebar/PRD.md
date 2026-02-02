# Sidebar Navigation

## Overview

Introduce a left-side navigation sidebar to the application, providing persistent access to plans, scenario comparisons, settings, and user account features. The sidebar follows the inset sidebar pattern with secondary navigation from shadcn/ui.

**Reference**: [shadcn/ui Sidebar Block #08](https://ui.shadcn.com/blocks/sidebar#sidebar-08) - Inset sidebar with secondary navigation

## Feature Description

A collapsible sidebar positioned on the left side of the screen provides hierarchical navigation for the application. The sidebar includes a branded header, grouped navigation items, and footer utilities for help, feedback, and user settings.

---

## Detailed Requirements

### Layout & Structure

| Section | Position | Description |
|---------|----------|-------------|
| Header | Top | SNT logo and branding |
| Main Navigation | Middle (scrollable) | Plans group, Scenario comparisons, Layers, Cost settings |
| Footer | Bottom (fixed) | Help, Feedback, User account |

### Header

- **Logo**: Display the SNT logo
- **Position**: Fixed at top of sidebar
- **Behavior**: Always visible, does not scroll with content

### Main Navigation Groups

#### Group 1: Plans

- **Group header**: "Plans" with a **plus button** (+) to the right
- **Plus button action**: Opens a modal/form to create a new plan
- **Navigation items** (listed below header):
  - BAU
  - NSP 2026-30
- **Item behavior**: Clicking a plan navigates to/selects that plan
- **Active state**: Currently selected plan is visually highlighted

#### Group 2: Scenario Comparisons

- **Group header**: "Scenario comparisons"
- **Behavior**: Clicking navigates to scenario comparison view
- **Note**: This is a standalone link, not a collapsible group with children

#### Standalone Links

- **Layers**: Link to layers management/configuration
- **Cost settings**: Link to cost settings page

### Footer Section

Located at the bottom of the sidebar, always visible:

| Item | Description |
|------|-------------|
| Help | Opens help documentation or support resources |
| Feedback | Opens feedback form or link to feedback channel |
| User account | Opens user settings/profile dropdown or page |

### Sidebar Behavior

- **Collapse/Expand**: Sidebar can be collapsed to icon-only mode
- **Persistence**: Collapsed state persists across page navigations
- **Responsive**: On mobile/small screens, sidebar may become a drawer
- **Keyboard navigation**: Support standard keyboard navigation (Tab, Enter, Arrow keys)

### Visual Design

- **Style**: Follow shadcn/ui sidebar-08 inset pattern
- **Inset appearance**: Sidebar content appears inset within a container
- **Colors**: Match existing application theme
- **Hover states**: Items show hover feedback
- **Active states**: Current page/selection clearly indicated

---

## Non-Requirements

The following are explicitly **not** part of this feature:

- No drag-and-drop reordering of plans
- No inline editing of plan names from the sidebar
- No nested sub-items within plans (plans are flat links)
- No search functionality within the sidebar
- No notification badges or counters
- No dark/light mode toggle in sidebar (use system settings)

---

## Technical Notes

- Use shadcn/ui `Sidebar` component as the foundation
- Install required dependencies: `@radix-ui/react-slot`, sidebar primitives
- Sidebar state (collapsed/expanded) should be stored in localStorage or a similar persistence mechanism
- Navigation should integrate with Next.js routing

---

## Acceptance Criteria

1. Sidebar displays on the left side of the screen following shadcn/ui sidebar-08 pattern
2. SNT logo appears in the sidebar header
3. "Plans" group displays with a plus (+) button next to the header
4. "BAU" and "NSP 2026-30" appear as navigation items under Plans
5. Plus button opens a create new plan flow
6. "Scenario comparisons" link is visible and clickable
7. "Layers" link is visible and clickable
8. "Cost settings" link is visible and clickable
9. Footer contains Help, Feedback, and User account links
10. Sidebar can be collapsed and expanded
11. Collapsed state persists across page navigations
12. Current page/selection is visually highlighted
13. All links have appropriate hover states
14. Keyboard navigation works correctly (Tab, Enter, Arrow keys)
