

## Add Extended Sort Options and Mock Data

### What Changes

Add sorting capability for 13 fields across both grid view (Sort dropdown) and table view, backed by new mock data fields on each asset.

### New Fields on LibraryAsset

The following fields will be added to the `LibraryAsset` interface in `src/lib/mockLibraryData.ts`:

| Field | Type | Description |
|-------|------|-------------|
| `downloads` | `number` | Total download count |
| `shares` | `number` | Times shared |
| `galleries` | `number` | Number of galleries containing this asset |
| `tags` | (already exists) | Will sort by tag count |
| `viewers` | `number` | Unique viewers |
| `publicViews` | `number` | Public/external view count |
| `publicDownloads` | `number` | Public download count |
| `approvalStatus` | (use existing `status`) | Already exists as `status` |
| `favorites` | `number` | Number of org users who favorited |
| `lastDownloadDate` | `Date \| null` | When the asset was last downloaded |
| `captureDate` | `Date` | When the content was originally captured |

### Files to Change

**1. `src/lib/mockLibraryData.ts`**
- Add new fields to the `LibraryAsset` interface
- Generate deterministic mock values for each new field using the existing seeded random approach
- `captureDate` will be set to a date before `dateCreated`
- `lastDownloadDate` will be null for ~20% of assets, otherwise a recent date
- Numeric fields (downloads, shares, etc.) will have realistic ranges

**2. `src/components/LibraryScreenV4.tsx`**
- Replace the simple Sort dropdown with a full list of 13 sort options
- Add sort state (`sortField` and `sortDirection`)
- Apply sorting to `filteredResults` before rendering the grid
- Sort options: Creator, Added Date, Capture Date, Downloads, Shares, Galleries, Tags, Viewers, Public Views, Public Downloads, Approval Status, Favorites, Last Download Date
- Each option toggles ascending/descending on repeated click

**3. `src/components/AssetTableView.tsx`**
- Expand the `SortField` type to include all 13 sort options
- Update the sorting logic in `sortedAssets` to handle each new field
- Remove the local `getDownloadCount` hash function (replaced by real mock data)

### Sort Behavior

- Clicking a sort option applies it as descending (highest first / newest first)
- Clicking the same option again toggles to ascending
- The active sort option shows a directional arrow indicator
- Default sort remains by Added Date (newest first) when no sort is selected

