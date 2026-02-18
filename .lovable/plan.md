

## Remove Heart (Favorites) Toggle from Filter Bar

### What Changes

Remove the heart/favorites toggle button from the Assets tab filter bar, along with its associated state and callback prop.

### Files to Change

**1. `src/components/FilterBar.tsx`**
- Remove the `isFavoritesActive` state variable
- Remove the `onFavoritesToggle` prop from `FilterBarProps`
- Remove the Heart toggle button block (lines 575-590)
- Remove `Heart` from the lucide-react imports (if no longer used elsewhere in this file)

**2. `src/components/LibraryScreen.tsx`**
- Remove the `isFavoritesActive` state variable
- Remove the `onFavoritesToggle` prop passed to `<FilterBar />`
- Remove any filtering logic that checks `isFavoritesActive` / `asset.isFavorite`
- Remove the Heart icon overlay on asset cards (the conditional rendering of `<Heart>` in the card thumbnail)

**3. `src/components/LibraryScreenV4.tsx`**
- Same cleanup: remove `isFavoritesActive` state, the `onFavoritesToggle` prop, the favorites filtering in `filteredResults`, and the Heart icon overlay on cards

### What Stays
- The `isFavorite` field on the data model (`LibraryAsset`) stays -- it's not harmful and could be used later
- The Branded (palette) toggle remains fully functional
