

## Change: Rename "Manually Tagged" to "Tags"

### Problem
The label "Manually Tagged" in the search typeahead dropdown should simply read "Tags".

### Fix

**File: `src/components/FacetedSearchWithTypeahead.tsx`** (line ~316)

Change:
```tsx
<h4 className="text-sm font-semibold text-foreground mb-2">Manually Tagged </h4>
```
To:
```tsx
<h4 className="text-sm font-semibold text-foreground mb-2">Tags</h4>
```

Single line change, no other files affected.

