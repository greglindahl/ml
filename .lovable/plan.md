

## Remove "More" Filter Dropdown from Filter Bar

### What Changes

Remove the "More" filter dropdown button and its associated code from the Assets tab filter bar. This feature will be revisited in a future iteration.

### Files to Change

**`src/components/FilterBar.tsx`**

1. Remove the `moreFilterCategories` array (lines ~219-228) containing the hardcoded filter options for Sport, Competition, Composition, etc.
2. Remove the entire `MoreFiltersDropdown` component function (lines ~230-340 approximately)
3. Remove the `<MoreFiltersDropdown ... />` usage in the filter bar JSX (line ~570)
4. Clean up any imports that become unused after removal (e.g., `DropdownMenuLabel` if only used there)

### What Stays

- All other filter dropdowns (People, Brand, Tags, etc.) remain unchanged
- The Branded (palette) toggle remains
- The active filter state management (`activeFilters`, `handleMultiSelect`, etc.) stays since it's shared infrastructure

