

## Fix: Archived Items Still Appearing in Sidebar Folder Tree

### Problem
When galleries are archived (via bulk action or individual action), only the `galleryList` state is updated with `archived: true`. The `folderTree` state — which drives the sidebar navigation — is **not** updated. Since the sidebar filters on `child.archived !== true` from the `folderTree` data, archived galleries continue to appear in the nav.

The same issue applies to newly created folders that get archived — if the archive action only updates one state but not the other.

### Fix

**`src/components/LibraryScreen.tsx`**

1. **Gallery bulk archive** (line ~1235): After setting `archived: true` in `galleryList`, also update the `folderTree` using `updateFolderInTree` for each selected gallery ID:
   ```
   selectedGalleries.forEach(id => {
     setFolderTree(prev => updateFolderInTree(prev, id, { archived: true }));
   });
   ```

2. **Any other gallery archive action** (individual gallery archive, gallery details archive): Search for all places where `setGalleryList` sets `archived: true` and add a corresponding `setFolderTree(prev => updateFolderInTree(prev, galleryId, { archived: true }))` call.

3. **Gallery unarchive**: Similarly, when galleries are unarchived via `setGalleryList`, also update `folderTree` to set `archived: false`.

This ensures both data stores stay in sync — the sidebar tree will correctly hide archived galleries and folders.

