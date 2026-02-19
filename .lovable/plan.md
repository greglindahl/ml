

## Add Counts to Suggestion Tags in Search Typeahead

### What Changes

Each tag pill in the "AI Identified" and "Manually Tagged" sections of the search suggestions dropdown will show a count number to the right, indicating how many matching assets exist for that tag.

### Technical Details

**File: `src/components/FacetedSearchWithTypeahead.tsx`**

The `suggestion.count` data is already computed but not rendered. Two button templates need updating:

**1. AI Identified pills (~line 489):** Add `{suggestion.count}` after the label span:
```tsx
<span>{suggestion.value}</span>
<span className="text-muted-foreground ml-1">({suggestion.count})</span>
```

**2. Manually Tagged pills (~line 509):** Same change:
```tsx
<span>{suggestion.value}</span>
<span className="text-muted-foreground ml-1">({suggestion.count})</span>
```

Two small additions -- the count data is already available, just needs to be displayed.

