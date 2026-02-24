

## Changes: Update Manual Tags for LeBron Search Results

### Problem
When searching "lebr", the Manually Tagged section shows unwanted tags: "Lakers", "King James", "game action", "NBA". These need to be removed and replaced with "Lebron James" (as a manual tag alongside the AI-identified one).

### Changes

**`src/lib/mockLibraryData.ts`**
- Remove `"Lakers"`, `"King James"`, `"game action"`, and `"NBA"` from the tags arrays of all LeBron assets (3 assets around lines 218, 256, 274)
- Add `"Lebron James"` as a manual tag — done by adding a `__manual` suffixed version like we won't do that. Instead, we'll simply add a `"Lebron James"` entry to the manual tags list

Actually, the simpler approach: since the code at line 291 skips any tag in `AI_GENERATED_TAGS` from the manual section, "Lebron James" won't appear there. To show it in both sections, I'll add a dedicated `"Lebron James"` entry directly into the `otherTags` array in the typeahead logic when it matches the query.

**`src/components/FacetedSearchWithTypeahead.tsx`** (around line 280-302)
- After building `otherTags` from asset tags, add explicit logic: if query matches "lebron james" and it's not already selected, push a `"Lebron James"` entry into `otherTags` with `isAiGenerated: false`

**`src/lib/mockLibraryData.ts`** (lines 218, 256, 274)
- Remove tags: `"Lakers"`, `"King James"`, `"game action"`, `"NBA"` from the 3 LeBron asset tag arrays
- Keep all other tags including `"Lebron Dunks"`, `"Lebron Highlights"`, `"Lebron Lakers"`

### Result
Searching "lebr" will show:
- **AI Identified**: Lebron James (with user icon), Victory, Nike, Adidas
- **Manually Tagged**: Lebron James (with tag icon), Lebron Dunks, Lebron Highlights, Lebron Lakers

