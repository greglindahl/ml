

## Add Checkmark to Search-Disabled Filter Items

### What Changes

When a user selects a tag (like "LeBron") from the search typeahead dropdown, it currently appears disabled (grayed out) in the corresponding filter dropdown (e.g., People). This change adds a checkmark next to those disabled items so they visually match manually-selected filters.

### Technical Details

**File: `src/components/FilterBar.tsx`**

On line 453, update the `checked` prop of the `DropdownMenuCheckboxItem` to also be `true` when the item is disabled by a search selection:

```tsx
// Before
checked={selected.some(s => s.value === option.value)}

// After
checked={selected.some(s => s.value === option.value) || isDisabledBySearch}
```

This is a one-line change. The item will show both the checkmark AND remain disabled/grayed out, making it clear that the filter is active (via search) and not independently toggleable.

### Files Changed

- `src/components/FilterBar.tsx` -- Add `|| isDisabledBySearch` to the `checked` condition (line 453)

