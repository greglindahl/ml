

## Add Sparkle Icon to AI Identified Tags

### Change

**File: `src/components/FacetedSearchWithTypeahead.tsx`** (~lines 497-507)

Add a `Sparkles` icon (already imported) to the right of the text in each AI Identified suggestion button:

Current:
```tsx
<span>{suggestion.value}</span>
```

Updated:
```tsx
<span>{suggestion.value}</span>
<Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
```

This keeps the existing left icon (User for People, bounding-box for Scene, badge-tm for Brand) and adds the sparkle on the right side of the label text. Single change, one file.

