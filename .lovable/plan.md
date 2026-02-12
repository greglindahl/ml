

## Wire Up Favorites and Branded Toggles with Asset Card Icons

### Overview

Connect the heart and palette toggle buttons to data filtering, and display corresponding icons on asset cards when each toggle is active.

### Data Changes

**File: `src/lib/mockLibraryData.ts`**

- Add `isFavorite: boolean` and `isBranded: boolean` fields to the `LibraryAsset` interface
- Randomly assign `isFavorite` and `isBranded` to existing mock assets (roughly 30-40% of assets get each flag) so there's a meaningful subset to filter

### FilterBar Changes

**File: `src/components/FilterBar.tsx`**

- Add two new optional callback props: `onFavoritesToggle?: (active: boolean) => void` and `onBrandedToggle?: (active: boolean) => void`
- Call these callbacks when the respective toggle buttons are clicked, passing the new state up to the parent

### LibraryScreenV4 Changes

**File: `src/components/LibraryScreenV4.tsx`**

- Add `isFavoritesActive` and `isBrandedActive` state variables
- Pass `onFavoritesToggle` and `onBrandedToggle` callbacks to `<FilterBar />`
- Filter `results` based on these toggles before rendering:
  - When favorites is active, only show assets where `isFavorite === true`
  - When branded is active, only show assets where `isBranded === true`
  - Both can be active simultaneously (AND logic)
- On each asset card's thumbnail area (the `aspect-[4/3]` div), conditionally render:
  - A `Heart` icon (filled, small) in the top-right corner when `isFavoritesActive` is true and the asset has `isFavorite === true`
  - A `Palette` icon (small) in the top-right corner when `isBrandedActive` is true and the asset has `isBranded === true`
  - If both are showing, stack them vertically (heart on top, palette below)

### Files Changed

1. `src/lib/mockLibraryData.ts` -- add fields to interface and mock data
2. `src/components/FilterBar.tsx` -- expose toggle callbacks via props
3. `src/components/LibraryScreenV4.tsx` -- filter logic and icon overlays on cards

