

## Changes: Wire Up "More" Filters, Fix Active Treatment, Add Chips for Sub-Filters

### Summary

Four issues to address:

1. **Wire up More sub-filters**: Source, Approval Status, and Sorted selections from the "More" dropdown are not tracked in LibraryScreen state and not reflected in the applied filter chips below the search bar.

2. **Active filter badge style**: Regular filters show "Brand (1)" with parentheses when active in compact mode. The "More" button uses a round circle badge. Change all active filters to use the circle badge style instead of parentheses.

3. **More sub-filter chips not showing**: The chip rendering logic in LibraryScreen only handles people, scene, brand, tags, creator, content-type, aspect-ratio, date-range, and folders. It doesn't include source, status, or organization-status.

4. **"Groups" not showing under search**: This likely refers to the More sub-filter categories not appearing as grouped chips under the search bar (same as issue 3).

---

### Technical Details

**File: `src/components/LibraryScreen.tsx`**

1. Add three new state variables:
   - `sourceFilter: string[]`
   - `approvalStatusFilter: string[]`
   - `orgStatusFilter: string[]`

2. Add cases to `handleFilterChange` switch for `"source"`, `"status"`, and `"organization-status"`.

3. Add chip rendering for these three filter groups in the "Unified Applied Filter Chips" section (~line 591-603), using appropriate icons and labels.

**File: `src/components/FilterBar.tsx`**

4. Change the active compact-mode button style from `{filter.label} ({totalActiveCount})` with parentheses to use a circle badge matching the More button style:
   - Replace `<span>{filter.label} ({totalActiveCount})</span>` (line 400) with:
     ```tsx
     <span>{filter.label}</span>
     <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">{totalActiveCount}</span>
     ```
   This matches the existing More button badge (line 598).

