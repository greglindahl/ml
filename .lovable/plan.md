

## Fix: People Filter Active State When Search Facet Selected

### Problem
When selecting "Lebron James" from the search typeahead, the Scene filter correctly shows the active treatment (e.g., "Scene (1)" with blue styling) when "Dunk" is selected, but the People filter does not. The checkmark appears inside the dropdown, but the button itself stays in its default inactive state.

### Root Cause
The filter button's active state is determined by `selected.length > 0` (line 388), where `selected` comes from `activeFilters[filter.id]`. However, search-originated facets are passed as `disabledValues` — they only affect the checkbox state inside the dropdown (line 468-471), not the `activeFilters` state that drives the button appearance.

The Scene filter likely works because the category mapping aligns differently. Let me trace: `disabledValues` are passed from LibraryScreen as facets with `category: f.category`. For "Dunk", the category is "Scene"; for "Lebron James" from AI Identified, the category is "People". The `categoryMap` on line 467 maps `people → "People"` and `scene → "Scene"`, so the matching should work for both. The issue is purely that `disabledValues` don't count toward the button's active treatment.

### Fix

**File: `src/components/FilterBar.tsx`** (lines 387-388, 393-395)

Count `disabledValues` that belong to each filter when determining the active state and display count:

```tsx
// Current:
const selected = activeFilters[filter.id] || [];
const isActive = selected.length > 0;

// Updated:
const selected = activeFilters[filter.id] || [];
const categoryMap: Record<string, string> = { people: "People", scene: "Scene", brand: "Brand", tags: "Tag" };
const disabledForFilter = disabledValues.filter(
  dv => dv.category.toLowerCase() === (categoryMap[filter.id] || "").toLowerCase()
);
const totalActiveCount = selected.length + disabledForFilter.length;
const isActive = totalActiveCount > 0;
```

Then update the compact mode button to show the combined count:

```tsx
// Current (line 395):
<span>{filter.label} ({selected.length})</span>

// Updated:
<span>{filter.label} ({totalActiveCount})</span>
```

This ensures any filter with search-originated facets (via `disabledValues`) gets the same blue active treatment and count display as filters with directly-selected values.

### Files Changed
- `src/components/FilterBar.tsx` — incorporate `disabledValues` count into active state and button label

