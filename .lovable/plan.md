

## Remove "Add filter..." Placeholder When Pills Are Present

### What Changes

When a pill is present in the search input, the "Add filter..." placeholder text will be removed entirely. The placeholder will only show the full search prompt when no pills are selected.

### Technical Details

**File: `src/components/FacetedSearchWithTypeahead.tsx`**

Change the placeholder logic on the inner `<input>` element from:

```
placeholder={selectedFacets.length === 0 ? placeholder : "Add filter..."}
```

to:

```
placeholder={selectedFacets.length === 0 ? placeholder : ""}
```

One line change.

