

## Show Current Location and Galleries in Edit Folder Dialog

### Two Changes

1. **Location dropdown shows current parent folder** — When editing a folder that is nested inside another folder, the Location select should default to that parent. Only folders at the root ("All Media") level should show "Select location..." as placeholder.

2. **Gallery list pre-populated** — The edit dialog should show the galleries already assigned to the folder, so the user can see and manage them.

### Implementation

**`src/components/FolderDetailsView.tsx`** (where `EditFolderDialog` is rendered, ~line 1019):
- Compute the folder's parent ID using the `buildBreadcrumbPath` helper (already in this file) or a `findParentId` utility (already exists in `FolderSidebar.tsx` — can be extracted or duplicated inline).
- Compute the folder's gallery children IDs by filtering `folder.children` for items with `type === "gallery"`.
- Pass these as `currentLocationId` and `currentGalleryIds` instead of the current hardcoded `null` and `[]`.

**`src/components/EditFolderDialog.tsx`** — No structural changes needed. It already initializes state from `currentLocationId` and `currentGalleryIds` props via the `useEffect`. The location select already supports showing "All Media" vs a folder name. The gallery section already renders selected galleries. The only behavior fix: when `currentLocationId` is `null`, the select shows "Select location..." (which is correct for root-level folders). When it has a value, it shows the parent folder name.

### Summary

This is primarily a data-passing fix in `FolderDetailsView.tsx` — the dialog component already supports both behaviors, it's just not receiving the right data.

