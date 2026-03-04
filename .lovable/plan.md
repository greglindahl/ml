

## Bug: Asset Bulk Actions Not Working on Top-Level Library Page

### Root Cause

The top-level Library page (`LibraryScreen.tsx`) has no `selectedAssets` state and the `CheckSquare` bulk-select button (line 988) has no `onClick` handler. Bulk asset selection is only implemented in `FolderDetailsView.tsx`. The asset grid cards on the Library page also lack checkbox overlays and selection click handlers.

### Fix

**`src/components/LibraryScreen.tsx`**

1. **Add `selectedAssets` state** — `useState<Set<string>>(new Set())`

2. **Wire the CheckSquare button** — toggle all/none selection on click, highlight when active

3. **Add `AssetBulkActionBar`** — render it above the asset grid when `selectedAssets.size > 0`, with select-all, favorite, archive, download, share, gallery, and delete actions

4. **Add checkbox overlays to asset grid cards** — show on hover (when nothing selected) or always (when selection active), matching the pattern in `FolderDetailsView`

5. **Add selection click handling to cards** — when in selection mode, clicking a card toggles its selection instead of navigating

6. **Pass `selectedAssets` and handlers to `AssetTableView`** — so list view also supports selection (matching how `FolderDetailsView` does it)

7. **Clear selection on tab change or filter change** — reset `selectedAssets` when switching away from Assets tab

All patterns already exist in `FolderDetailsView.tsx` and will be replicated to `LibraryScreen.tsx`.

