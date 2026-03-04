

## Add Folder Path to All Gallery Cards

Add a breadcrumb-style folder path line beneath each gallery card's metadata row, matching the uploaded mockup. Uses the existing `getGalleryLocationDisplay` helper which returns "Not in a folder" for unassigned galleries.

### Changes

**`src/components/LibraryScreen.tsx`**
- After the `assetCount` / `timeAgo` row (line ~1152), add a new line showing `getGalleryLocationDisplay(gallery.id, folderTree)` in `text-xs text-muted-foreground` styling
- `getGalleryLocationDisplay` is already imported

**`src/components/FolderDetailsView.tsx`**
- After the asset count / time row (line ~711), add the same folder path line using `getGalleryLocationDisplay(gallery.id, folderTree)`
- `getGalleryLocationDisplay` is already imported
- `folderTree` is available as a prop

Both render a small muted text line like: `Season 25-26 > In-Game` or `Not in a folder`

