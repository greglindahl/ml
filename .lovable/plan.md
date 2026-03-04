

## Two Changes: Bulk Action Icons + Functional Gallery Move

### 1. Add Favorite and Archive icons to the bulk action bar

Looking at the reference screenshot, the bulk action bar should show: checkbox + "N selected" on the left, and on the right: a heart icon (Favorite), an archive/box icon (Archive), and a three-dot menu (with Move, Delete inside).

**`src/components/FolderDetailsView.tsx`** (lines 648-673)
- Replace the current bulk action bar layout. Instead of just a three-dot dropdown on the right, add three separate icon buttons: Heart (favorite), Archive, and the existing three-dot menu (MoreHorizontal).
- Import `Heart` and `Archive` from lucide-react (Archive is already imported).
- The heart and archive buttons are visual-only for now (toast on click).

### 2. Make gallery moves actually update the folder tree

Currently `FolderDetailsView` handles the `onMove` callback from `MoveGalleriesDialog` by just showing a toast — it never updates the tree. The tree state lives in `LibraryScreen.tsx`. Similarly, `LibraryScreen.applyGalleryMoves` also only toasts.

**`src/components/FolderDetailsView.tsx`**
- Add a new prop `onMoveGalleries?: (moves: Record<string, string | null>) => void` to the interface.
- In the `MoveGalleriesDialog` `onMove` handler (lines 900-904), call `onMoveGalleries?.(moves)` in addition to closing the dialog. Also clear selectedGalleries after move.

**`src/components/LibraryScreen.tsx`**
- Update `applyGalleryMoves` (line 286) to actually mutate `folderTree` via `setFolderTree`: for each entry in `moves`, remove the gallery node from its current location in the tree and insert it into the target folder (or root "All Media" if null).
- Pass `onMoveGalleries={applyGalleryMoves}` as a new prop to `FolderDetailsView` (line 730).
- The same `applyGalleryMoves` already handles the All Media level move dialog.

The tree mutation logic: iterate `moves` entries, for each gallery ID remove it from the tree (walk tree, filter out matching child), then insert into target folder's children (or do nothing for null/All Media since galleries at root aren't in a folder).

