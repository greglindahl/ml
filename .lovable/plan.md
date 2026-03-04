

## Enable Archive/Unarchive Toggle on Folders and Galleries Tabs

Currently, archiving a folder removes it from the tree entirely (`removeFolderById`). The "Archived Only" toggles exist in the UI but are non-functional. To make them work, we need to track archived state rather than deleting items.

### Changes

**`src/lib/mockFolderData.ts`**
- Add an optional `archived?: boolean` field to the `FolderItem` interface

**`src/components/LibraryScreen.tsx`**
- Change `handleArchiveFolder`: instead of removing the folder from the tree, set `archived: true` on it via `updateFolderInTree`
- Add `archivedFoldersOnly` state (boolean, default false) wired to the Switch on the Folders tab
- Add `archivedGalleriesOnly` state (boolean, default false) — will need a toggle on the Galleries tab toolbar too
- Filter folder cards: when `archivedFoldersOnly` is false, hide folders where `archived === true`; when true, show only `archived === true` folders
- Same pattern for galleries on the Galleries tab
- Add an "Unarchive" action (context menu or button) on folder/gallery cards when viewing archived items
- `handleUnarchiveFolder`: set `archived: false` via `updateFolderInTree`

**`src/components/FolderDetailsView.tsx`**
- Add `archivedFoldersOnly` state wired to the existing "Archived Only" checkbox (convert to Switch for consistency)
- Filter the folders tab children: hide archived folders normally, show only archived when toggled
- Add "Unarchive" option to folder context menus when showing archived items
- Same for the Galleries tab: add an "Archived Only" toggle and filter galleries accordingly
- Pass through `onUnarchiveFolder` callback

**`src/components/GalleryFilterBar.tsx`**
- The `showArchived` state already exists but isn't exposed. Surface it via a callback prop so parent components can use it for filtering.

### Unarchive flow
When viewing "Archived Only", each folder/gallery card gets a visible "Unarchive" action (e.g., a button overlay or context menu item). Clicking it sets `archived: false` and the item reappears in the normal view.

### What stays the same
- The Archive dialog UI (recently updated) remains unchanged
- Delete still removes from tree permanently

