

## Unified Applied Filter Chips Below Search Input

### What Changes

All applied filters -- whether selected from the search typeahead (AI tags, manual tags, people) or from the FilterBar dropdowns (People, Scene, Brand, Tags, Creator, Type, Date, Ratio, Folders) -- will appear as removable chips in a single row **below the search input**. The FilterBar dropdowns will no longer show inline chips in their trigger buttons; instead they'll show a count indicator (e.g., "People (2)") when filters are active.

### How It Works

1. **Move search-selected chips out of the search input** -- The `FacetedSearchWithTypeahead` component currently renders `Badge` chips inline inside the search input container. These will move to a new chip row rendered **below** the search input.

2. **FilterBar reports selections upward** -- FilterBar already calls `onFilterChange(filterId, values)`. The parent (`LibraryScreen`) already tracks these. We'll collect all active filter selections from both sources and render them as a unified chip row.

3. **FilterBar triggers become count-only** -- When a filter has active selections, the dropdown trigger button will show something like "Scene (2)" instead of rendering inline chip badges. This keeps the filter bar compact.

4. **Chip row renders below search** -- A new section between the search input and the filter bar will display all applied chips with consistent styling and remove (X) buttons.

### Technical Details

**File: `src/components/LibraryScreen.tsx`**

- Collect all active filters (from `searchSelectedFacets` + filter bar state like `peopleFilter`, `sceneFilter`, `brandFilter`, `tagsFilter`, `creatorFilter`, `contentTypeFilter`, `aspectRatioFilter`, `dateRangeFilter`, `folderFilter`) into a unified array of chip objects with `{ label, source, value, sourceId }`.
- Render a chip row (using `Badge` components) between the search `<div>` and the `<FilterBar>`, showing all applied filters.
- Each chip has an X button. Clicking it removes the filter from its source (calls `handleRemoveFacet` for search facets, or clears the specific value from the relevant filter state).
- Pass a new prop to `FilterBar` (e.g., `compactMode={true}`) so it renders active triggers as "Label (N)" instead of inline chips.

**File: `src/components/FacetedSearchWithTypeahead.tsx`**

- Remove the inline `Badge` pill rendering from inside the search input container (lines 392-411). The pills will now be rendered by the parent.
- Expose `onRemoveFacet` callback so the parent can trigger removal.

**File: `src/components/FilterBar.tsx`**

- Add a `compactMode` prop. When true, active filter triggers show "Label (N)" text instead of rendering inline chip badges, since the chips are now displayed in the unified row above.
- Expose an `onRemoveValue` prop so the parent can programmatically remove a specific filter value.

**File: `src/components/LibraryScreen.tsx` (chip row rendering)**

The chip row will look approximately like:

```text
[Search input                                          ]
[LeBron James x] [Dunk x] [Nike x] [Image x] [Last 7 Days x]   [Clear all]
[People v] [Scene v] [Brand v] [Tags v] [Creator v] ...
```

Each chip will be styled consistently using the existing `Badge` component with appropriate icons (User for people, Tag for tags, Sparkles for AI, etc.).

### Files Changed

- `src/components/LibraryScreen.tsx` -- Add unified chip row, wire up removal handlers
- `src/components/FacetedSearchWithTypeahead.tsx` -- Remove inline pills from search input, keep them managed by parent
- `src/components/FilterBar.tsx` -- Add compact mode for active trigger display, expose removal callback
- `src/components/FolderDetailsView.tsx` -- Same chip row pattern (if desired, can be follow-up)
- `src/components/GalleryDetailsView.tsx` -- Same chip row pattern (if desired, can be follow-up)

