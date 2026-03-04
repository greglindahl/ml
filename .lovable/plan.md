

## Add Favorite and Archive Buttons to Gallery Bulk Action Bar

### Problem
The gallery bulk action bar on the top-level Library Galleries tab only shows a checkbox, selection count, and a three-dot menu with Move and Delete. It's missing the dedicated **Favorite** (Heart) and **Archive** icon buttons that should appear between the count and the three-dot menu, matching the asset bulk action bar pattern shown in `AssetBulkActionBar`.

### Fix

**`src/components/LibraryScreen.tsx`** (lines ~1221-1223)

After the `"{selectedGalleries.size} selected"` span and before the `<DropdownMenu>`, add two icon buttons:

1. **Favorite** — `<Heart>` icon button with tooltip "Favorite"
2. **Archive** — `<Archive>` icon button with tooltip "Archive", which sets `archived: true` on all selected galleries and clears the selection

The Archive handler will update each selected gallery in `galleryList` state to set `archived: true`, then clear the selection. This matches the existing archive pattern used for folders.

