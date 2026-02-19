
## Add "More" Dropdown with Source and Status Flyout Filters

### What Changes

A "More" button will be added to the filter bar (after the Ratio filter). Clicking it reveals a dropdown with two sub-menu items -- "Source" and "Status" -- each flying out into a multi-select checkbox list.

**Source options:**
- Posted Content
- Imported Content
- Published Content
- Uploaded Content
- Engage Content
- Requested Content

**Status options:**
- Pending
- Approved
- Rejected

### Technical Details

**File: `src/components/FilterBar.tsx`**

1. **Import `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`** from the existing dropdown-menu component (already exported, just not imported here).

2. **Add the "More" dropdown** between the Branded toggle button and the Custom Date Range Popover (after line 445, before line 447). It will be a `DropdownMenu` with:
   - Trigger: a `Button` labeled "More" with a chevron icon
   - Content containing two `DropdownMenuSub` items:
     - **Source** sub-trigger that flies out to show 6 `DropdownMenuCheckboxItem` options
     - **Status** sub-trigger that flies out to show 3 `DropdownMenuCheckboxItem` options

3. **Integrate with existing filter state**: Reuse the existing `activeFilters`, `handleMultiSelect`, `handleRemoveValue`, and `clearFilter` functions with filter IDs `"source"` and `"status"`. The active pill display and "Clear all" functionality will work automatically since they already iterate over `activeFilters`.

4. **Active state on the More button**: When either source or status has selections, the More button will show an active indicator (count badge or highlighted style), consistent with the existing filter button patterns.

No new components or dependencies needed -- this uses the existing `DropdownMenuSub` pattern already available in the dropdown-menu UI component.
