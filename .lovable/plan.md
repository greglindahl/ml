

## Hide Result Count from Search Suggestions

### What Changes

The "Suggestions (26 results)" line in the search typeahead dropdown will be simplified to just "Suggestions" -- removing the dynamic count.

### Technical Details

**File: `src/components/FacetedSearchWithTypeahead.tsx` (line 474)**

Change:
```
Suggestions ({filteredAssets.length} results)
```

To:
```
Suggestions
```

One-line text change.

