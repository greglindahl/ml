

## Changes: Filter Manual Tags to Only Show Query Matches

### Problem
The "Manually Tagged" section currently shows all tags from filtered assets (line 282), regardless of whether they contain the search term. Tags like "action" and "Sponsor Y" appear because they exist on LeBron assets, even though they don't contain "lebron".

### Fix

**File: `src/components/FacetedSearchWithTypeahead.tsx`** (line 282)

Add a filter so that manual tags only appear if they contain the search query text:

```tsx
// Current (line 282):
allTags.slice(0, 10).forEach(tag => {

// Updated:
allTags.filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10).forEach(tag => {
```

This single-line change ensures only tags matching the search input (e.g., containing "lebron") show in the Manually Tagged section. The injected "Lebron James" entry below (line 304) already checks for query match, so no changes needed there.

### Result
Searching "lebron" will show:
- **AI Identified**: Dunk, Celebration, Victory, Nike (contextual AI tags)
- **Manually Tagged**: Lebron James, Lebron Dunks, Lebron Highlights (all contain "lebron")
- "action" and "Sponsor Y" will no longer appear

