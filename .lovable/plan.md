

## Changes: Remove Counts from Suggestions & Add LeBron Manual Tags

### 1. Remove hit counts from typeahead suggestions

**File: `src/components/FacetedSearchWithTypeahead.tsx`**

Remove the `(count)` display from both the AI Identified and Manually Tagged suggestion buttons. There are two spots:

- AI Identified buttons (around line 293): remove `<span className="text-muted-foreground ml-1">({suggestion.count})</span>`
- Manually Tagged buttons (around line 311): remove the same count span

### 2. Add LeBron-prefixed manual tags to mock data

**File: `src/lib/mockLibraryData.ts`**

Add the following manual tags to various LeBron assets so they appear in the "Manually Tagged" section when searching "lebron":

- `"Lebron Dunks"` — add to assets that have dunk-related content
- `"Lebron Highlights"` — add to a couple of LeBron assets
- `"Lebron Lakers"` — add to LeBron Lakers assets

These tags are NOT added to `AI_GENERATED_TAGS`, so they'll correctly appear under "Manually Tagged."

### Files Changed
- `src/components/FacetedSearchWithTypeahead.tsx` — remove count displays
- `src/lib/mockLibraryData.ts` — add manual tags to LeBron assets

