## Add "More" Filter to the Assets Tab

Add a new "More" dropdown filter button after the existing "Ratio" filter on the Assets tab. This filter acts as a container for additional sub-filters, each accessible via a drill-in (sub-menu) pattern.

### What It Looks Like

- A "More" button styled like the other filter buttons (outline, chevron down)
- Clicking opens a dropdown with a "More Filters" header
- Below the header, a list of filter categories, each with a right chevron arrow
- Clicking a category opens a sub-menu with multi-select checkboxes
- Categories from the reference: Sport, Competition / League, Composition, Jersey Number, Physical Location, Venue, Event

### What It Does

- Visual/interaction only -- selecting items does not need to filter actual data
- Selecting items in a sub-menu shows them as active pills (same pattern as other filters)
- Supports multi-select within each sub-category

### Technical Details

**File: `src/components/FilterBar.tsx**`

1. Add a new "More" dropdown after the existing filter loop, using `DropdownMenu` with `DropdownMenuSub` / `DropdownMenuSubTrigger` / `DropdownMenuSubContent` for the drill-in pattern
2. Define a `moreFilters` array with 10 categories (Folders, Sport, Competition / League, Composition, Jersey Number, Scene, Brand, Physical Location, Venue, Event), each containing mock checkbox options
3. Each sub-menu uses `DropdownMenuCheckboxItem` for multi-select
4. Track selections in the existing `activeFilters` state so active pills and clear-all behavior work consistently
5. When any "More" sub-filter has active selections, show them as pills on the "More" button (matching the existing active-filter pill pattern)

**No other files need to change** -- the FilterBar is already used on the Assets tab and the new filter will appear automatically.