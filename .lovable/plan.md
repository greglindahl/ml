

## Add Asset Bulk Actions to Folder Details and Gallery Details Views

Replicate the gallery bulk selection pattern for assets. Three locations need changes: the Assets tab in `FolderDetailsView`, the Assets tab in `GalleryDetailsView`, and the `AssetTableView` (which already has per-row checkboxes but no bulk action bar).

### Constants

- `ASSET_BULK_LIMIT = 20` — cap for actions like "Add to Gallery" or "Share" (with tooltip pattern matching galleries)

### Changes

**`src/components/FolderDetailsView.tsx`**
- Add `selectedAssets` state (`Set<string>`) and helpers (`toggleSelectAllAssets`, `handleSelectAsset`, `isAnyAssetSelected`, `allAssetsSelected`)
- Wire the existing CheckSquare button in the assets view toggle to activate bulk select mode (toggle all on/off, highlight when active)
- In the asset grid cards (lines 473-516), add a checkbox overlay on the thumbnail (visible on hover or when any asset is selected), clicking the card in bulk mode toggles selection
- Add a bulk action bar above the grid (matching the gallery pattern): checkbox + "N selected" on left; Heart, Archive icons + three-dot menu (Download, Share, Add to Gallery, Delete) on right
- Apply `ASSET_BULK_LIMIT` with disabled state + tooltip on "Share" and "Add to Gallery" menu items
- Pass `selectedAssets` and `onSelectAsset`/`onSelectAll` props to `AssetTableView` so list view shares the same selection state

**`src/components/GalleryDetailsView.tsx`**
- Same pattern: add `selectedAssets` state, wire CheckSquare button, add checkbox overlays on grid cards, add bulk action bar
- Bulk actions: Heart, Archive, three-dot menu with Download, Share, Remove from Gallery, Delete
- Same `ASSET_BULK_LIMIT` tooltip pattern

**`src/components/AssetTableView.tsx`**
- Accept optional props: `selectedAssets`, `onSelectAsset`, `onSelectAll` — when provided, use external selection state instead of internal
- This ensures switching between grid and list view preserves selection
- The existing per-row checkbox and select-all logic already works; just lift state when props are provided

### Bulk action bar layout (both views)
```text
┌─────────────────────────────────────────────────┐
│ ☑ N selected                    ♡  📦  ⋯       │
│                                 Fav Arc  Menu   │
└─────────────────────────────────────────────────┘
```
Menu items: Download, Share (disabled > 20), Add to Gallery (disabled > 20), Delete

