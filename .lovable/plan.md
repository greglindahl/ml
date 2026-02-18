

## Add Contextual Counts to Filter Dropdowns

### What Changes

Six filter dropdowns (People, Scene, Brand, Creator, Type, Ratio) will be updated to show counts derived from the actual dataset, sorted from most to least -- matching how Tags already works.

Each dropdown option will show the count on the right side (e.g., "Lebron James  12", "Image  45").

### How It Will Look

Instead of:
```
Lebron James
Steph Curry
Kevin Durant
```

It will look like:
```
Lebron James    18
Steph Curry     15
Kevin Durant    12
```

Options with zero matches in the dataset will not appear. Options are sorted by count, highest first.

### Technical Details

**File: `src/components/FilterBar.tsx`**

For each of the six filters, replace the hardcoded options array with a dynamically computed one (same pattern as Tags), using `mockLibraryAssets`:

1. **People** -- count assets where `asset.tags` includes the person's name, sorted by count descending. Only people that appear in the dataset are shown.

2. **Scene** -- count assets where `asset.tags` includes the scene value (e.g., "dunk", "celebration"), sorted by count descending. Only scenes found in the data are shown.

3. **Brand** -- count assets where `asset.tags` includes the brand value (case-insensitive match against tags like "Nike", "adidas"), sorted by count descending.

4. **Creator** -- count assets by `asset.creatorId`, map to creator name using the known creator list. Sorted by count descending.

5. **Type** (content-type) -- count assets by `asset.type` ("image" / "video"). Sorted by count descending.

6. **Ratio** (aspect-ratio) -- count assets by `asset.aspectRatio` ("1:1", "16:9", etc.). Sorted by count descending.

The count display already works in the dropdown rendering -- the existing code shows `option.count` on the right side of each checkbox item. We just need to add the `count` property to each filter's options.

### Implementation Approach

Each filter's `options` array will use an immediately-invoked function (like Tags already does) to compute options from `mockLibraryAssets`. The known filter values (people names, scene types, etc.) will be matched against asset data to get counts, then sorted descending and filtered to only include values with count > 0.
