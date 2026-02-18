

## Make Tags Filter a Flat, Contextual List Sorted by Count

### What Changes

The Tags filter dropdown currently shows tags organized into hardcoded groups (Sports, Teams, Categories) with a fixed set of options. This will change to:

- A **flat list** (no group headers) of tags pulled directly from the dataset
- Each tag shows a **count** of how many assets have that tag
- Tags are **sorted by count** from most to least
- Only tags that **actually exist** in the mock asset data are shown

### How It Will Look

Instead of:
```
SPORTS
  Basketball
  Football
  ...
TEAMS
  Lakers
  Warriors
  ...
```

It will look like:
```
basketball (28)
NBA (25)
Lakers (12)
Nike (11)
action (9)
...
```

Each row is a checkbox item with the tag name on the left and the count on the right, sorted descending by count.

### Technical Details

**File: `src/components/FilterBar.tsx`**

1. Add a new prop `assets?: LibraryAsset[]` to `FilterBarProps` so the component can compute tag counts from the actual dataset
2. Import `mockLibraryAssets` from `@/lib/mockLibraryData` as a fallback (or use it directly since assets are static)
3. Change the Tags filter config:
   - Set `hasGroups: false` (or remove it)
   - Instead of hardcoded options, dynamically compute tags from the assets array:
     - Collect all tags across all assets
     - Count occurrences of each tag
     - Sort by count descending
     - Map to `FilterOption[]` format (no `group` property)
4. In the dropdown rendering for the Tags filter, display the count next to each tag label (e.g., as a muted text on the right side of each row)

**File: `src/components/LibraryScreen.tsx`**

- Pass the `allAssets` array to `FilterBar` via the new `assets` prop so tags stay contextual

Since the assets are static mock data, an alternative simpler approach is to import `mockLibraryAssets` directly inside `FilterBar.tsx` and compute the tags there without needing a new prop. This keeps the change minimal. The plan will use this simpler approach.

### Summary of Changes

- `src/components/FilterBar.tsx`: Replace the hardcoded grouped Tags options with dynamically computed flat options from mock data, including counts, sorted by count descending. Add count display in the dropdown items.

