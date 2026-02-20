

## Make Search-Selected Filter Items Toggleable (Not Disabled)

### What Changes

Currently, when a user selects a tag like "LeBron James" from the search typeahead, the corresponding item in the People filter dropdown is disabled and grayed out (with a checkmark). Users want to be able to click that item directly in the dropdown to toggle it off, instead of having to remove it from the chip row above.

The item will still show a checkmark (indicating it's active), but it will no longer be grayed out or unclickable. Clicking it will remove the corresponding search facet.

### Technical Details

**File: `src/components/FilterBar.tsx`**

1. Add a new callback prop `onRemoveDisabledValue` so the FilterBar can tell the parent to remove a search-selected facet.

2. Update the `isDisabledBySearch` items (around line 453-455):
   - Remove `opacity-50 pointer-events-none` styling so the item looks normal and is clickable.
   - Remove the `if (!isDisabledBySearch)` guard on `onCheckedChange`.
   - When a search-disabled item is unchecked, call `onRemoveDisabledValue` instead of `handleMultiSelect`.

```tsx
// Before
className={`... ${isDisabledBySearch ? "opacity-50 pointer-events-none" : ""}`}
onCheckedChange={checked => { if (!isDisabledBySearch) handleMultiSelect(...); }}

// After
onCheckedChange={checked => {
  if (isDisabledBySearch) {
    onRemoveDisabledValue?.(option.value, categoryMap[filter.id] || "");
  } else {
    handleMultiSelect(filter.id, option.value, option.label, checked);
  }
}}
// No opacity-50 or pointer-events-none
```

**File: `src/components/LibraryScreen.tsx`**

1. Pass an `onRemoveDisabledValue` callback to `FilterBar` that finds the matching search facet and removes it via `searchHandleRef.current?.removeFacet(value)`.

```tsx
<FilterBar
  ...
  onRemoveDisabledValue={(value) => {
    searchHandleRef.current?.removeFacet(value);
  }}
/>
```

This reuses the existing `removeFacet` mechanism that already handles removing a chip from the unified row and re-triggering the search.

### Files Changed

- `src/components/FilterBar.tsx` -- Add `onRemoveDisabledValue` prop, remove disabled styling, wire up toggle behavior
- `src/components/LibraryScreen.tsx` -- Pass `onRemoveDisabledValue` callback that removes the search facet

