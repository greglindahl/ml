

## Make "Clear All" Only Clear Filters, Not Search Text

### What Changes

The "Clear all" button next to the applied filter chips will only clear the filter chips (search facets + filter bar selections) while preserving whatever text is typed in the search input.

### Technical Details

**File: `src/components/FacetedSearchWithTypeahead.tsx`**

Add a new method `clearFacetsOnly` to the imperative handle that clears selected facets without touching the search query:

```tsx
export interface FacetedSearchWithTypeaheadHandle {
  removeFacet: (value: string) => void;
  clearAll: () => void;
  clearFacetsOnly: () => void;  // new
}
```

The new method:
```tsx
const clearFacetsOnly = () => {
  setSelectedFacets([]);
};
```

Expose it on the handle ref alongside the existing methods.

**File: `src/components/LibraryScreen.tsx`**

Update `handleClearAllChips` (line 618-621) to call `clearFacetsOnly` instead of `clearAll`:

```tsx
const handleClearAllChips = () => {
  searchHandleRef.current?.clearFacetsOnly();
  filterBarHandleRef.current?.clearAll();
};
```

This keeps "lebron" in the search input while removing all applied chips (dunk, scene filters, etc.).

### Files Changed

- `src/components/FacetedSearchWithTypeahead.tsx` -- Add `clearFacetsOnly` method to handle
- `src/components/LibraryScreen.tsx` -- Call `clearFacetsOnly` instead of `clearAll` in the chip row's Clear All button

