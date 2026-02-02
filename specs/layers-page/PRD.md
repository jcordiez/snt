# Layers Page

## Overview

Create a dedicated page to display and manage all available layers (metrics) within the application. Layers represent data such as total population, rural population, mortality rates, etc. The page provides a searchable, categorized list with actions to create, edit, and delete layers.

## Feature Description

The Layers page displays a comprehensive list of all available metrics grouped by category. Each layer entry shows contextual information and provides quick access to edit and delete actions via a dropdown menu.

---

## Detailed Requirements

### Page Header

| Element | Description |
|---------|-------------|
| Title | "Available metrics" - main page heading |
| Search field | Text input to filter layers by name |
| Create button | "Create layer" button to add a new layer |

**Layout**: Title on top, followed by a row containing the search field (left) and "Create layer" button (right-aligned).

### Layer List Structure

Layers are organized into collapsible groups by category. Example categories:

- Demographics (total population, rural population, urban population)
- Health (mortality, morbidity, disease prevalence)
- Infrastructure (health facilities, roads, water sources)
- Economic (poverty index, income levels)

### Layer Row Layout

Each layer row displays the following elements in a single horizontal line:

| Position | Element | Description |
|----------|---------|-------------|
| Left | Info icon | Clickable icon that shows layer details/description |
| Center-left | Layer name | The display name of the layer |
| Right | "Source" label | Text label indicating the data source section |
| Far right | More menu | `MoreHorizontal` icon button triggering a dropdown menu |

**Visual alignment**: Info icon and layer name are left-aligned; "Source" label and more menu are right-aligned.

### Info Icon Behavior

- **Icon**: Use an info/information icon (e.g., `Info` from lucide-react)
- **Click action**: Opens a tooltip, popover, or modal showing:
  - Layer description
  - Data source details
  - Last updated date
  - Units of measurement (if applicable)

### More Menu Actions

The `MoreHorizontal` icon button opens a dropdown menu with:

| Action | Description |
|--------|-------------|
| Edit | Opens edit modal/form to modify layer properties |
| Delete | Deletes the layer (with confirmation dialog) |

### Search Functionality

- **Behavior**: Filter layers in real-time as user types
- **Scope**: Search matches against layer name
- **Empty state**: Show "No layers found" message when search yields no results
- **Clear**: Include a clear button (X) when search has text

### Create Layer Button

- **Label**: "Create layer"
- **Action**: Opens a modal or navigates to a form for creating a new layer
- **Position**: Right side of the toolbar row, below the title

### Category Groups

- **Collapsible**: Each category can be expanded/collapsed
- **Default state**: All categories expanded on page load
- **Visual**: Category headers are distinct from layer rows (bold, slightly larger)
- **Count**: Optionally show layer count per category (e.g., "Demographics (4)")

---

## Non-Requirements

The following are explicitly **not** part of this feature:

- No drag-and-drop reordering of layers
- No bulk selection or bulk delete
- No layer preview/visualization on this page
- No import/export functionality
- No layer duplication action
- No sorting options (alphabetical, date added, etc.)
- No pagination (assume manageable number of layers)

---

## Technical Notes

- Use shadcn/ui components: `Input` for search, `Button` for create action, `DropdownMenu` for more actions
- Icons from lucide-react: `Info`, `MoreHorizontal`, `Plus`, `Pencil`, `Trash2`
- Layer data should be fetched from existing data structures/API
- Search filtering should be client-side for immediate feedback
- Consider using `Collapsible` component from shadcn/ui for category groups

---

## Acceptance Criteria

1. Page displays "Available metrics" as the main title
2. Search field appears below the title on the left
3. "Create layer" button appears below the title on the right
4. Layers are grouped by category with visible category headers
5. Each layer row displays: info icon, layer name, "Source" label, and more menu icon
6. Info icon click shows layer details (tooltip/popover/modal)
7. More menu contains "Edit" and "Delete" options
8. "Edit" action opens layer edit interface
9. "Delete" action shows confirmation before deleting
10. Search filters layers in real-time by name
11. Empty search results show appropriate message
12. Categories can be collapsed and expanded
13. All interactive elements have appropriate hover states
14. Keyboard navigation works for menu and buttons
