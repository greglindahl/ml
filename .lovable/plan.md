

## Add Extended Sort Options and Mock Data ✅ COMPLETED

Added sorting capability for 13 fields across both grid view (Sort dropdown) and table view, backed by new mock data fields on each asset.

### New Fields Added to LibraryAsset

| Field | Type |
|-------|------|
| `downloads` | `number` |
| `shares` | `number` |
| `galleries` | `number` |
| `viewers` | `number` |
| `publicViews` | `number` |
| `publicDownloads` | `number` |
| `favorites` | `number` |
| `lastDownloadDate` | `Date \| null` |
| `captureDate` | `Date` |

### Sort Options (13 total)

Creator, Added Date, Capture Date, Downloads, Shares, Galleries, Tags, Viewers, Public Views, Public Downloads, Approval Status, Favorites, Last Download Date

### Files Changed

- `src/lib/mockLibraryData.ts` — interface + deterministic mock data generation
- `src/components/LibraryScreenV4.tsx` — sort dropdown with 13 options + sorting logic
- `src/components/AssetTableView.tsx` — expanded sort fields, removed mock `getDownloadCount`
