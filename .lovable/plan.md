

## Hide Search Input in Filter Dropdowns

### What Changes

Remove the search input that currently appears at the top of every filter dropdown (People, Scene, Folders, etc.). The screenshot shows a "Search folders..." input inside the Folders dropdown -- this and all similar search inputs in other filter dropdowns will be hidden for this first iteration.

### Technical Details

**File: `src/components/FilterBar.tsx`**

Remove or hide the search input block (lines 399-408) inside the `DropdownMenuContent`. This block renders a search icon + text input with placeholder "Search {filter}..." for every filter dropdown.

Also remove the filtering logic that uses `searchQueries` to filter options, so all options always display. The `searchQueries` state and setter can remain (harmless) or be cleaned up.

Specifically:
1. Delete lines 399-408 (the search input `div` block)
2. Update option filtering to no longer filter by `searchQueries[filter.id]` -- show all options regardless

### Files Changed

- `src/components/FilterBar.tsx` -- Remove search input from filter dropdown content, remove search-based filtering of options

